// Firebase Configuration Module
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBh5fiVKRvzO5eAxgE2zhoURdudC7haRLE",
    authDomain: "kanlume-8fab4.firebaseapp.com",
    projectId: "kanlume-8fab4",
    storageBucket: "kanlume-8fab4.firebasestorage.app",
    messagingSenderId: "687202395809",
    appId: "1:687202395809:web:4cdc93952dbfcc1bb932e0",
    measurementId: "G-KC34WBXQ6Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Firestore data paths
const USERS_COLLECTION = 'artifacts/kanlume-8fab4/users';
const ADMIN_COLLECTION = 'artifacts/kanlume-8fab4/admin';

// Helper functions for user data management
const FirebaseService = {
    // Authentication functions
    async registerUser(email, password, fullName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            const userData = {
                userId: user.uid,
                email: email,
                fullName: fullName,
                checkingBalance: 1000.00, // Starting balance
                savingsBalance: 500.00,   // Starting savings
                transactions: [{
                    date: new Date().toISOString(),
                    type: 'credit',
                    description: 'Welcome bonus - Account opening',
                    amount: 1000.00,
                    balance: 1000.00
                }],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Update last login
            await updateDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), {
                lastLogin: new Date().toISOString()
            });
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async logoutUser() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // User data functions
    async getUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
            if (userDoc.exists()) {
                return { success: true, data: userDoc.data() };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateUserBalance(userId, accountType, newBalance) {
        try {
            const updateData = {};
            updateData[accountType + 'Balance'] = newBalance;
            
            await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async addTransaction(userId, transaction) {
        try {
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                transactions: arrayUnion(transaction)
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Admin functions
    async getAllUsers() {
        try {
            const usersQuery = query(collection(db, USERS_COLLECTION));
            const querySnapshot = await getDocs(usersQuery);
            const users = [];
            
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, users: users };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getAllTransactions() {
        try {
            const users = await this.getAllUsers();
            if (!users.success) return users;
            
            const allTransactions = [];
            users.users.forEach(user => {
                if (user.transactions) {
                    user.transactions.forEach(transaction => {
                        allTransactions.push({
                            ...transaction,
                            userId: user.userId,
                            userName: user.fullName,
                            userEmail: user.email
                        });
                    });
                }
            });
            
            // Sort by date (newest first)
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return { success: true, transactions: allTransactions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Transfer functions
    async internalTransfer(userId, fromAccount, toAccount, amount, description) {
        try {
            const userResult = await this.getUserData(userId);
            if (!userResult.success) return userResult;
            
            const userData = userResult.data;
            const fromBalance = userData[fromAccount + 'Balance'];
            const toBalance = userData[toAccount + 'Balance'];
            
            if (amount > fromBalance) {
                return { success: false, error: 'Insufficient funds' };
            }
            
            const newFromBalance = fromBalance - amount;
            const newToBalance = toBalance + amount;
            
            // Update balances
            const updateData = {};
            updateData[fromAccount + 'Balance'] = newFromBalance;
            updateData[toAccount + 'Balance'] = newToBalance;
            
            // Create transactions
            const debitTransaction = {
                date: new Date().toISOString(),
                type: 'debit',
                description: description || `Transfer to ${toAccount} account`,
                amount: -amount,
                balance: newFromBalance
            };
            
            const creditTransaction = {
                date: new Date().toISOString(),
                type: 'credit',
                description: description || `Transfer from ${fromAccount} account`,
                amount: amount,
                balance: newToBalance
            };
            
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                ...updateData,
                transactions: arrayUnion(debitTransaction, creditTransaction)
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async externalTransfer(senderId, recipientId, fromAccount, amount, description) {
        try {
            // Get sender data
            const senderResult = await this.getUserData(senderId);
            if (!senderResult.success) return senderResult;
            
            // Get recipient data
            const recipientResult = await this.getUserData(recipientId);
            if (!recipientResult.success) return { success: false, error: 'Recipient not found' };
            
            const senderData = senderResult.data;
            const recipientData = recipientResult.data;
            
            const senderBalance = senderData[fromAccount + 'Balance'];
            
            if (amount > senderBalance) {
                return { success: false, error: 'Insufficient funds' };
            }
            
            const newSenderBalance = senderBalance - amount;
            const newRecipientBalance = recipientData.checkingBalance + amount;
            
            // Create transactions
            const senderTransaction = {
                date: new Date().toISOString(),
                type: 'debit',
                description: `Transfer to ${recipientData.fullName} - ${description}`,
                amount: -amount,
                balance: newSenderBalance
            };
            
            const recipientTransaction = {
                date: new Date().toISOString(),
                type: 'credit',
                description: `Transfer from ${senderData.fullName} - ${description}`,
                amount: amount,
                balance: newRecipientBalance
            };
            
            // Update sender
            const senderUpdateData = {};
            senderUpdateData[fromAccount + 'Balance'] = newSenderBalance;
            
            await updateDoc(doc(db, USERS_COLLECTION, senderId), {
                ...senderUpdateData,
                transactions: arrayUnion(senderTransaction)
            });
            
            // Update recipient
            await updateDoc(doc(db, USERS_COLLECTION, recipientId), {
                checkingBalance: newRecipientBalance,
                transactions: arrayUnion(recipientTransaction)
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async payBill(userId, payee, accountNumber, amount, notes) {
        try {
            const userResult = await this.getUserData(userId);
            if (!userResult.success) return userResult;
            
            const userData = userResult.data;
            
            if (amount > userData.checkingBalance) {
                return { success: false, error: 'Insufficient funds in checking account' };
            }
            
            const newBalance = userData.checkingBalance - amount;
            
            const transaction = {
                date: new Date().toISOString(),
                type: 'debit',
                description: `Bill Payment - ${payee} (${accountNumber})`,
                amount: -amount,
                balance: newBalance
            };
            
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                checkingBalance: newBalance,
                transactions: arrayUnion(transaction)
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Export everything
export {
    app,
    auth,
    db,
    analytics,
    onAuthStateChanged,
    FirebaseService,
    USERS_COLLECTION,
    ADMIN_COLLECTION
};