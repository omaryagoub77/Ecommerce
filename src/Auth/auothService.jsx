import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { auth } from "../firebaseConfig";

// Sign Up
export const register = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Sign In
export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign Out
export const logout = () => {
  return signOut(auth);
};
