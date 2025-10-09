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

// Account Generation Utilities
const AccountGenerator = {
    // Generate unique account number (10 digits)
    generateAccountNumber() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return (timestamp.slice(-7) + random).slice(0, 10);
    },

    // Generate routing number (9 digits) - KAN LUME Bank routing
    generateRoutingNumber() {
        return '021000021'; // Standard format for KAN LUME Bank
    },

    // Generate SWIFT code
    generateSwiftCode() {
        return 'KANLUMNG'; // KAN LUME Nigeria
    },

    // Generate IBAN (International Bank Account Number)
    generateIBAN(accountNumber) {
        const countryCode = 'NG'; // Nigeria
        const checkDigits = '89'; // Standard check digits
        const bankCode = 'KANL'; // KAN LUME bank code
        return `${countryCode}${checkDigits}${bankCode}${accountNumber.padStart(10, '0')}`;
    },

    // Generate BVN (Bank Verification Number) - 11 digits
    generateBVN() {
        let bvn = '';
        for (let i = 0; i < 11; i++) {
            bvn += Math.floor(Math.random() * 10);
        }
        return bvn;
    },

    // Generate card number (16 digits) - Visa format
    generateCardNumber() {
        const prefix = '4532'; // Visa prefix for KAN LUME
        let cardNumber = prefix;
        
        // Generate 12 more digits
        for (let i = 0; i < 12; i++) {
            cardNumber += Math.floor(Math.random() * 10);
        }
        
        return cardNumber;
    },

    // Generate CVV (3 digits)
    generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
    },

    // Generate card expiry date (5 years from now)
    generateCardExpiry() {
        const now = new Date();
        const expiryYear = now.getFullYear() + 5;
        const expiryMonth = Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0');
        return `${expiryMonth}/${expiryYear.toString().slice(-2)}`;
    },

    // Generate PIN (4 digits)
    generatePIN() {
        return Math.floor(Math.random() * 9000 + 1000).toString();
    },

    // Generate complete bank details for a user
    generateBankDetails(userId, fullName) {
        const accountNumber = this.generateAccountNumber();
        const cardNumber = this.generateCardNumber();
        
        return {
            // Account Details
            accountNumber: accountNumber,
            routingNumber: this.generateRoutingNumber(),
            swiftCode: this.generateSwiftCode(),
            iban: this.generateIBAN(accountNumber),
            bvn: this.generateBVN(),
            
            // Bank Information
            bankName: 'KAN LUME Bank',
            bankCode: 'KLB001',
            branchCode: '001',
            branchName: 'KAN LUME Main Branch',
            branchAddress: '123 Banking Street, Lagos, Nigeria',
            
            // Account Type
            accountType: 'Savings Account',
            accountStatus: 'Active',
            
            // Card Details
            cardDetails: {
                cardNumber: cardNumber,
                cardType: 'Visa Debit',
                cardName: fullName.toUpperCase(),
                expiryDate: this.generateCardExpiry(),
                cvv: this.generateCVV(),
                pin: this.generatePIN(),
                cardStatus: 'Active',
                dailyLimit: 500000, // ₦500,000
                monthlyLimit: 2000000, // ₦2,000,000
                issuedDate: new Date().toISOString(),
                cardColor: this.getRandomCardColor()
            },
            
            // Additional Details
            currency: 'NGN',
            minimumBalance: 1000,
            interestRate: 2.5, // 2.5% per annum
            createdDate: new Date().toISOString()
        };
    },

    // Get random card color theme
    getRandomCardColor() {
        const colors = [
            { name: 'Royal Blue', primary: '#4285f4', secondary: '#1a73e8' },
            { name: 'Emerald Green', primary: '#34a853', secondary: '#137333' },
            { name: 'Deep Purple', primary: '#9c27b0', secondary: '#7b1fa2' },
            { name: 'Crimson Red', primary: '#ea4335', secondary: '#d33b2c' },
            { name: 'Golden Orange', primary: '#ff9800', secondary: '#f57c00' }
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// Helper functions for user data management
const FirebaseService = {
    // Authentication functions
    async registerUser(email, password, fullName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Generate complete bank details
            const bankDetails = AccountGenerator.generateBankDetails(user.uid, fullName);
            
            // Create user document in Firestore
            const userData = {
                userId: user.uid,
                email: email,
                fullName: fullName,
                checkingBalance: 1000.00, // Starting balance
                savingsBalance: 500.00,   // Starting savings
                
                // Bank Details
                ...bankDetails,
                
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
            return { success: true, user: userCredential.user, bankDetails };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get current authenticated user
    getCurrentUser() {
        return auth.currentUser;
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

    // Card management functions
    async updateCardStatus(userId, status) {
        try {
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                'cardDetails.cardStatus': status
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateCardLimits(userId, dailyLimit, monthlyLimit) {
        try {
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                'cardDetails.dailyLimit': dailyLimit,
                'cardDetails.monthlyLimit': monthlyLimit
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async changeCardPIN(userId, newPIN) {
        try {
            await updateDoc(doc(db, USERS_COLLECTION, userId), {
                'cardDetails.pin': newPIN
            });
            return { success: true };
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
    AccountGenerator,
    USERS_COLLECTION,
    ADMIN_COLLECTION
};