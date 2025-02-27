import React, { useState, useEffect } from "react"
import {
	Container,
	Button,
	Typography,
	Card,
	CardContent,
	TextField,
} from "@mui/material"
import {
	sendSignInLinkToEmail,
	signInWithEmailLink,
	isSignInWithEmailLink,
	onAuthStateChanged,
	signOut,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

const fetchBitcoinPrice = async () => {
	try {
		const response = await fetch("https://api.coincap.io/v2/assets/bitcoin")
		const data = await response.json()
		return data.data.priceUsd
	} catch (error) {
		console.error("Error fetching Bitcoin price:", error)
		return null
	}
}

const BitcoinGuessApp = () => {
	const [price, setPrice] = useState(null)
	const [previousPrice, setPreviousPrice] = useState(null)
	const [guess, setGuess] = useState(null)
	const [score, setScore] = useState(0)
	const [email, setEmail] = useState("")
	const [userId, setUserId] = useState(null)
	const [feedback, setFeedback] = useState("")

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			if (user) {
				setUserId(user.uid)
				initializeUser(user.uid)
			}
		})
		return () => unsubscribe()
	}, [])

	useEffect(() => {
		if (isSignInWithEmailLink(auth, window.location.href)) {
			let storedEmail = window.localStorage.getItem("emailForSignIn")
			if (!storedEmail) {
				storedEmail = window.prompt(
					"Please provide your email for confirmation"
				)
			}
			signInWithEmailLink(auth, storedEmail, window.location.href)
				.then(result => {
					window.localStorage.removeItem("emailForSignIn")
					setUserId(result.user.uid)
					initializeUser(result.user.uid)
				})
				.catch(error => console.error(error))
		}
	}, [])

	useEffect(() => {
		console.log("fetching price")
		const fetchPrice = async () => {
			const newPrice = await fetchBitcoinPrice()
			setPreviousPrice(prevPrice => prevPrice ?? newPrice)
			setPrice(newPrice)
		}
		fetchPrice()
		const interval = setInterval(fetchPrice, 60000)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		if (guess && previousPrice !== null) {
			resolveGuess(price)
		}
	}, [price])

	const initializeUser = async uid => {
		const userRef = doc(db, "users", uid)
		const userSnap = await getDoc(userRef)
		if (userSnap.exists()) {
			setScore(userSnap.data().score)
		} else {
			await setDoc(userRef, { score: 0 })
		}
	}

	const sendMagicLink = async () => {
		const actionCodeSettings = {
			url: window.location.href,
			handleCodeInApp: true,
		}
		await sendSignInLinkToEmail(auth, email, actionCodeSettings)
		window.localStorage.setItem("emailForSignIn", email)
		alert("Check your email for the sign-in link")
	}

	const handleLogout = async () => {
		await signOut(auth)
		setUserId(null)
		setScore(0)
	}

	const makeGuess = async direction => {
		setGuess({ direction, timestamp: Date.now() })
		setFeedback("")
	}

	const resolveGuess = async newPrice => {
		if (!guess || !previousPrice) return

		const correct =
			(guess.direction === "up" && newPrice > previousPrice) ||
			(guess.direction === "down" && newPrice < previousPrice)

		const newScore = correct ? score + 1 : score - 1
		setScore(newScore)
		setFeedback(correct ? "Correct!" : "Wrong!")
		setGuess(null)

		const userRef = doc(db, "users", userId)
		await updateDoc(userRef, { score: newScore })
	}

	return (
		<Container
			maxWidth="sm"
			style={{ textAlign: "center", marginTop: "20px" }}
		>
			<Card>
				<CardContent>
					<Typography variant="h5">
						Bitcoin Price Prediction
					</Typography>
					{!userId ? (
						<>
							<TextField
								label="Email"
								variant="outlined"
								value={email}
								onChange={e => setEmail(e.target.value)}
								fullWidth
								style={{ marginBottom: "10px" }}
							/>
							<Button
								variant="contained"
								color="primary"
								onClick={sendMagicLink}
							>
								Sign In with Magic Link
							</Button>
						</>
					) : (
						<>
							<Typography variant="h6">
								Current Price: ${price}
							</Typography>
							<Typography variant="h6">Score: {score}</Typography>
							<Typography variant="h6">{feedback}</Typography>
							<Button
								variant="contained"
								color="primary"
								onClick={() => makeGuess("up")}
								disabled={!!guess}
								style={{ margin: "10px" }}
							>
								Guess Up
							</Button>
							<Button
								variant="contained"
								color="secondary"
								onClick={() => makeGuess("down")}
								disabled={!!guess}
								style={{ margin: "10px" }}
							>
								Guess Down
							</Button>
							<Button
								variant="contained"
								color="error"
								onClick={handleLogout}
								style={{ margin: "10px" }}
							>
								Logout
							</Button>
						</>
					)}
				</CardContent>
			</Card>
		</Container>
	)
}

export default BitcoinGuessApp
