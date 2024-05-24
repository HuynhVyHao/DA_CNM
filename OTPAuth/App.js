// App.js trong ứng dụng React Native

import React, { useState } from "react";
import { Button, TextInput, View, StyleSheet, Alert } from "react-native";

export default function App() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const sendOTP = async () => {
    try {
      const response = await fetch("http://192.168.1.28:3000/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log(data);
      if (data && data.otp) {
        // Hiển thị giao diện nhập OTP
        // Ví dụ: Navigation.navigate("EnterOTP", { email: email });
        Alert.alert("OTP sent successfully!");
      } else {
        Alert.alert("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("An error occurred. Please try again later.");
    }
  };

  const verifyOTP = async () => {
    try {
      const response = await fetch("http://192.168.1.28:3000/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      console.log(data);
      if (data && data.success) {
        Alert.alert("OTP verified successfully!");
      } else {
        Alert.alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("An error occurred. Please try again later.");
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
        placeholder="Enter your email"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />
      <Button onPress={sendOTP} title="Send OTP" color="#841584" />
      <TextInput
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          marginTop: 20,
        }}
        placeholder="Enter OTP"
        onChangeText={(text) => setOtp(text)}
        value={otp}
      />
      <Button onPress={verifyOTP} title="Verify OTP" color="#841584" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
