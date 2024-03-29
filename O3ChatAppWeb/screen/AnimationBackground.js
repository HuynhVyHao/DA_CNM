import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";

const AnimationBackground = ({ navigation }) => {
  setTimeout(() => {
    navigation.navigate("LoginASign");
  }, 1200);
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../assets/fonts/KeaniaOne-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return undefined;
  }
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        // Background Linear Gradient
        colors={["#4AD8C7", "#B728A9"]}
        style={styles.background}
      />
      <View style={styles.logo}>
        <Text style={styles.txtLogo}>4MChat</Text>
      </View>
    </SafeAreaView>
  );
};

export default AnimationBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  txtLogo: {
    color: "#fff",
    fontSize: 64,
    fontFamily: "keaniaone-regular",
  },
  logo: {
    width: 243,
    alignItems: "center",
    height: 84,
    borderRadius: 10,
    backgroundColor: "rgba(217, 217, 217, 0.50)",
  },
});
