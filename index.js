import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';

import App from './App';

// Must be registered outside the React tree so it runs even when the app
// is killed. The OS displays the notification automatically from the
// notification payload; this handler is for any extra background processing.
messaging().setBackgroundMessageHandler(async (_remoteMessage) => {});

registerRootComponent(App);
