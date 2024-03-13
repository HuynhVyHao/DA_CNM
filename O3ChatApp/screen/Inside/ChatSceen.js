import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
} from "react-native";
import React from "react";
import { Dimensions } from "react-native";
import IconAnt from "react-native-vector-icons/AntDesign";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

export const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } =
  Dimensions.get("window");

const ChatSceen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={"#1197bd"} />

      <SafeAreaView>
        <View style={styles.upperHeaderPlaceholer} />
      </SafeAreaView>

      <SafeAreaView style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 10,
          }}
        >
          <IconAnt name="search1" size={30} color={"#fff"} />
          <TextInput
            placeholder="Tìm kiếm"
            placeholderTextColor={"#fff"}
            style={{
              width: 235,
              height: 30,
              color: "#000", // This is the text color when there is input
              fontSize: 16,
              borderRadius: 10,
              paddingLeft: 10,
              borderWidth: 1,
            }}
          />
          <Pressable
            onPress={() => {
              navigation.navigate("QRScanner");
            }}
          >
            <IconAnt name="qrcode" size={30} color={"#fff"} />
          </Pressable>
          <IconAnt name="plus" size={30} color={"#fff"} />
        </View>
        <View style={styles.logo}>
          <Text style={styles.txtLogo}>4MChat</Text>
        </View>
        <View style={styles.upperHeader} />

        <View style={styles.lowerHeader} />
      </SafeAreaView>
      <ScrollView>
        <View style={styles.paddingForHeader} />
        <View style={styles.viewContent}>
          <LinearGradient
            // Background Linear Gradient
            colors={["#4AD8C7", "#B728A9"]}
            style={styles.background}
          />
          {/* <Text>Viet code ở đây  </Text> */}
        </View>
        <View style={styles.scrollViewContent} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatSceen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  background: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  header: {
    width: "100%",
    backgroundColor: "#03c6fc",
    position: "absolute",
  },
  paddingForHeader: {
    height: 50,
  },
  upperHeaderPlaceholer: {
    height: 50,
  },
  upperHeader: {
    height: 50,
  },
  lowerHeader: {
    height: 50,
  },
  scrollViewContent: {
    height: WINDOW_HEIGHT,
    backgroundColor: "white",
  },
  viewContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  txtLogo: {
    color: "#fff",
    fontSize: 30,
    fontFamily: "keaniaone-regular",
  },
  logo: {
    width: 120,
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(217, 217, 217, 0.50)",
    alignSelf: "center",
    marginTop: 10,
  },
});
