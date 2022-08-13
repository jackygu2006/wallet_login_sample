import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { checkIfWalletIsConnected ,connectWallet } from './services/walletConnections';
import Web3 from 'web3';
import './App.css';

function App() {
  const { 
    setCurrentAccount, 
    setCurrentNetwork, 
		setJwToken, 
		currentAccount,
		currentNetwork,
		jwToken,
  } = useAuth();
	const [response, setResponse] = useState('');
	const axios = require('axios').default;
	const BASE_API_URL = 'http://localhost:8089';

	useEffect(() => {
    const init = async() => {
			try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setCurrentNetwork(parseInt(chainId, 16))

				const accounts = await window.ethereum.request({ method: 'eth_accounts'});
				setCurrentAccount(accounts[0]);
  
				await loginWithWallet(parseInt(chainId, 16), accounts[0]);

        window.ethereum.on('accountsChanged', async function (accounts) {
          // setCurrentAccount(accounts[0]);
					// await loginWithWallet(currentNetwork, accounts[0]);
          window.location.reload()
        })
        
        window.ethereum.on('chainChanged', async function (chainId) {
          // setCurrentNetwork(parseInt(chainId, 16));
					// await loginWithWallet(parseInt(chainId, 16), currentAccount);
          window.location.reload()
        })
      } catch(err) {
        console.log(err)
      }
    }
    if(currentAccount === undefined || currentNetwork === undefined) init();
	}, [currentAccount]);

	useEffect(() => {
		const getAccount = async() => {
			if(window.location.pathname!=="/") {
				if(!window.ethereum) {
					console.log("Please install metamask");
					return;
				} else {
					const account = await await checkIfWalletIsConnected();
					setCurrentAccount(account);
					await loginWithWallet(currentNetwork, account);
				}
			}
		}
		getAccount()
	}, [setCurrentAccount]);

	const handleLogin = async() => {
		if(!window.ethereum) {
			console.log("Please install metamask");
			return;
		}
		const account = await connectWallet();
		setCurrentAccount(account);
		await loginWithWallet(currentNetwork, account);
	}

	const loginWithWallet = async (chainId, account) => {
		// const registered = await checkIfUserRegistered(accounts[0]);
		setResponse('');
		// Request nonce from backend
		console.log(chainId, account);
		if(chainId === undefined || account === undefined) return;
		const responseNonce = await axios.get(BASE_API_URL + `/wallet/${chainId}/${account}/nonce`);
		console.log(responseNonce);
		const nonce = responseNonce.data.nonce;

		// Sign message
		const signedMessage = await handleSignMessage(account, nonce);
		// Send signature to backend
		const responseSign = await axios.post(BASE_API_URL + `/wallet/${chainId}/${account}/signature`, signedMessage);
		setJwToken(responseSign.data.token);
	}

	const getProfile = async () => {
		const result = await axios({
			method: 'GET',
			url: BASE_API_URL + `/wallet/profile/`,
			headers: { 
				'Authorization': jwToken
			}
		});
		if(result.data.user.address.toLowerCase() === currentAccount.toLowerCase()) setResponse(JSON.stringify(result.data.user));
		else setResponse('Please sign and switch you account');
	}

	const updateAvatar = async () => {
		const result = await axios({
			method: 'post',
			url: BASE_API_URL + `/wallet/update_avatar`,
			data: {
				url: 'https://tva1.sinaimg.cn/large/e6c9d24egy1h4q41wynhmj20ia0ia75g.jpg',
				chainId: currentNetwork,
			},
			headers: {
				'Authorization': jwToken
			}
		})
		console.log(result);
	}

	// const checkIfUserRegistered = async(address) => {
	// 	const response = await axios({
	// 		method: 'GET',
	// 		url: BASE_API_URL + '/wallet/' + address,
	// 		withCredentials: true,
	// 		headers: {
	// 			'Content-Type': 'application/json',
	// 			"Accept": "*/*"
	// 		}
	// 	});
	// 	// Handle response
	// 	if (response.data.success && response.data.address.toLowerCase() === address.toLowerCase()) {
	// 		return true;
	// 	} else {
	// 		return false; // await registerUser(address)
	// 	}
	// }

	// const registerUser = async(address) => {
	// 	const response = await axios.post(BASE_API_URL + '/wallet/register', {
	// 		address: address,
	// 	})
	// 	console.log('Register user response: ' + response);
	// }

	const handleSignMessage = (publicAddress, nonce) => {
		// Define instance of web3
		var web3 = new Web3(window.ethereum)
		return new Promise((resolve, reject) =>
			web3.eth.personal.sign(
				web3.utils.fromUtf8(`Nonce: ${nonce}`),
				publicAddress,
				(err, signature) => {
					if (err) return reject(err);
					return resolve({ publicAddress, signature });
				}
			)
		);
	}

	const updateProfile = async() => {
		const result = await axios({
			method: 'post',
			url: BASE_API_URL + `/wallet/update_profile`,
			data: {
				chainId: currentNetwork,
				name: 'jackygu',
				email: 'jackygu@gmail.com',
				twitter: '@jackygu',
				facebook: 'fb://jackygu',
				wechat: 'wc://jackygu',
				ins: 'ins://jackygu'
			},
			headers: {
				'Authorization': jwToken
			}
		})
		console.log(result);
	}

  return (
		<div>
			<div>wallet-login-sample</div>
			<div>{currentAccount}</div>
			<div>{BASE_API_URL}</div>
			<div>{currentNetwork}</div>
			<div>{jwToken}</div>
			<div><button onClick={() => handleLogin()}>Connect wallet</button></div>
			<div><button onClick={() => getProfile()}>Get Profile</button></div>
			<div><button onClick={() => updateAvatar()}>Update Avatar</button></div>
			<div><button onClick={() => updateProfile()}>Update Profile</button></div>
			<div>{response}</div>
		</div>
  );
}

export default App;
