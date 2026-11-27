import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GameScreen } from "./game/GameScreen";

/** İlk açılışta doğrudan oyun: zorunlu menü, giriş ya da reklam yok (#202). */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <GameScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
