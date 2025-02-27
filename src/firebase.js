import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { initializeApp } from "firebase/app"

const firebaseConfig = {
	apiKey: "AIzaSyCZeuaiwaUiHVql5vtpG4bxEHtttU2DrbE",
	authDomain: "bitcoinguesser-4027d.firebaseapp.com",
	projectId: "bitcoinguesser-4027d",
	storageBucket: "bitcoinguesser-4027d.firebasestorage.app",
	messagingSenderId: "195390281544",
	appId: "1:195390281544:web:ecd6c4d36eecf8d13ec57d",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
