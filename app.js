require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 5001

app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json({ limit: '1mb' }));

// Endpoints for verifying phone number
app.post('/generateOTP', require('./verify-phone.js').generate);
app.post('/verifyOTP', require('./verify-phone.js').verify);

// Endpoints for verifying username and password
app.post('/verifyUsername', require('./verify-username.js').verify);

// Endpoints for verifying names
app.post('/verifyName', require('./verify-name.js').verify);

// Endpoints for verifying about
app.post('/verifyAbout', require('./verify-about.js').verify);

// Endpoints for creating account
app.post('/create', require('./create-account.js').createAccount);

// Endpoints for login
app.post('/login', require('./login-account.js').loginAccount);

app.post('/home/retrive', require('./account-home.js').retrieve);
app.post('/home/challenges', require('./account-home.js').getChallenges);
app.post('/home/retrive/notification', require('./account-notification.js').retrieveNotification);
app.post('/home/retrive/pending-game', require('./account-pending-game.js').retrievePendingGame);
app.post('/home/refund', require('./account-home.js').refundChallenge)

// Endpoints for payments
app.post('/payment/create-payment-request', require('./payment-request.js').paymentReq);
app.get('/payment/paystackCallback', require('./payment-request.js').paymentCallback);
app.post('/payment/paystackWebhook', require('./payment-request.js').paymentWebhook);

// Endpoints for creating challenges and tournaments
app.post('/create/challenge', require('./create-challenge.js').createChallenge);
app.post('/create/tournament', require('./create-tournament.js').createTournament);

// Endpoints for accepting challenges and tournaments
app.post('/accept/challenge', require('./create-challenge').acceptChallenge);
app.post('/accept/tournament', require('./create-tournament').acceptTournament);

// Endpoints for declining challenges and tournaments
app.post('/decline/challenge', require('./create-challenge').declineChallenge);
app.post('/decline/tournament', require('./create-tournament').declineTournament);

// Endpoint for getting challenges and tournaments detail for host
app.post('/get-host/challenge', require('./create-challenge.js').getChallenge);
app.post('/get-host/tournament', require('./create-tournament.js').getTournament);

// Endpoints for messages
app.post('/send-messages', require('./messages.js').sendMessages);
app.get('/get-messages/:message', require('./messages.js').getMessages);
app.post('/retrieve-messages', require('./messages.js').retrieveMessages);
app.post('/get-chats', require('./messages.js').getChats);

// Endpoints for getting profiles
app.get('/profile/:rUsername/:rProfile', require('./get-profile.js').getProfile);
app.post('/profile-follow', require('./get-profile.js').followProfile);
app.get('/profile/profile-pic', require('./get-profile.js').getProfilePic);

// Endpoints for searches
app.get('/search', require('./search.js').retrieveSearch);

// Endpoints for rooms
app.post('/join-room', require('./join-room.js').joinRoom);
app.post('/leave-room', require('./join-room.js').leaveRoom);
app.post('/toggle-ready', require('./join-room.js').toggleReady);
app.get('/listen-room/:username/:roomStore', require('./join-room.js').getRoomInfo);

// Endpoints for whot lobbies
app.post('/lobby/whots', require('./join-whots-lobby.js').startLobby);
app.get('/lobby/whots/:user/:lobbyID', require('./join-whots-lobby.js').joinLobby);
app.post('/lobby/whots/move', require('./join-whots-lobby.js').makeMove);
app.post('/lobby/whots/refresh', require('./join-whots-lobby.js').refreshLobby);
app.post('/lobby/whots/complete-transaction', require('./join-whots-lobby.js').completeTransaction);

// Endpoints for ludo lobbies
app.post('/lobby/ludo', require('./join-ludo-lobby.js').startLobby);
app.get('/lobby/ludo/:user/:lobbyID', require('./join-ludo-lobby.js').joinLobby);
app.post('/lobby/ludo/roll-dice', require('./join-ludo-lobby.js').rollDice);
app.post('/lobby/ludo/make-move', require('./join-ludo-lobby.js').makeMove);
app.post('/lobby/ludo/complete-transaction', require('./join-ludo-lobby.js').completeTransaction);

// Endpoint for pool lobbies
app.post('/lobby/pool', require('./join-pool-lobby.js').startLobby);
app.get('/lobby/pool/:user/:lobbyID', require('./join-pool-lobby.js').joinLobby);
app.post('/lobby/pool/make-move', require('./join-pool-lobby.js').makeMove);
app.post('/lobby/pool/refresh', require('./join-pool-lobby.js').refreshLobby);
app.post('/lobby/pool/complete-transaction', require('./join-pool-lobby.js').completeTransaction);

// Endpoint for settings
app.post('/settings', require('./settings.js').accountSettings);

// Endpoint for retrieving transactions
app.post('/transactions/money', require('./transactions.js').retrieveMoneyTransactions);
app.post('/transactions/game', require('./transactions.js').retrieveGameTransactions);

// Endpoint for wallets
app.post('/wallet/create', require('./wallet.js').createWallet);
app.post('/wallet/download', require('./wallet.js').singleWallet);
app.post('/wallet/retrieve', require('./wallet.js').getWallet);
app.post('/wallet/wallet-list', require('./wallet.js').walletList);
app.post('/wallet/settings', require('./wallet.js').updateWalletSettings);
app.post('/wallet/private', require('./wallet.js').getPrivateKey);
app.post('/wallet/remove', require('./wallet.js').removeWallet);

app.listen(PORT, () => {
    console.log("Server is listening on port " + PORT);
});