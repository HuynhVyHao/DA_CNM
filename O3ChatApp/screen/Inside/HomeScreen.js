import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/AntDesign";
import ChatSceen from "./ChatSceen";
import PhoneBookScreen from "./PhoneBookScreen";
import PersonalScreen from "./PersonalScreen";

const Tab = createBottomTabNavigator();

const HomeScreen = ({  route }) => {
  const { user } = route.params;

  const handleBackPress = () => {
    alert(
      "Exit",
      "Về trang đăng nhập?",
      [
        {
          text: "Cancel",
          onPress: () => {
            console.log("Cancel Pressed");
          },
          style: "cancel",
        },
        {
          text: "Ok",
          onPress: () => {
            navigation.navigate("LoginASign");
          },
        },
      ],
      {
        cancelable: false,
      }
    );
    return true;
  };
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <Text></Text>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
