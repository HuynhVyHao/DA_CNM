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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

export const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } =
  Dimensions.get("window");

const UserSceen = ({ navigation, user }) => {
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <SafeAreaView style={styles.container}>
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
          <IconAnt name="setting" size={30} color={"#fff"} />
        </View>
      </SafeAreaView>
      <View style={styles.paddingForHeader} />
      <View style={styles.viewContent}>
        <LinearGradient
          // Background Linear Gradient
          colors={["#4AD8C7", "#B728A9"]}
          style={styles.background}
        />
        <View style={styles.infoPersonal}>
          <Image
            style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 10 }}
            source={{ uri: user?.avatarUser }}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.txtUser}>{user?.hoTen}</Text>
            <Pressable>
              <Text style={styles.txtViewUser}>Xem trang cá nhân</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.securityAccount}>
          <Icon
            name="security"
            size={30}
            color={"#000"}
            style={{ marginLeft: 10, marginTop: 10 }}
          />
          <Text style={styles.txtSecurity}>Tài khoản và bảo mật</Text>
        </Pressable>

        <Pressable style={styles.Privacy}>
          <IconAnt
            name="lock"
            size={30}
            style={{ marginLeft: 10, marginTop: 10 }}
          />
          <Text style={styles.txtPrivacy}>Quyền riêng tư</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default UserSceen;

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
    height: "100%",
    backgroundColor: "#03c6fc",
    position: "absolute",
  },
  paddingForHeader: {
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
  infoPersonal: {
    width: "100%",
    height: 80,
    fontSize: 16,
    paddingLeft: 10,
    borderWidth: 1,
    backgroundColor: "white",
    flexDirection: "row",
    borderColor: "#ccc",
    alignItems: "center",
  },
  securityAccount: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "white",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  txtSecurity: {
    marginLeft: 10,
    fontSize: 20,
    marginTop: 12,
  },
  Privacy: {
    flexDirection: "row",
    backgroundColor: "white",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  txtPrivacy: {
    marginLeft: 10,
    fontSize: 20,
    marginTop: 12,
  },
  txtUser: {
    color: "#000",
    fontSize: 18,
  },
  txtViewUser: {
    color: "#696969",
    fontSize: 16,
  },
});
