import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DynamoDB } from "aws-sdk";
import { useFonts } from "expo-font";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const SignUpForm = ({ navigation }) => {
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");

  const signUp = async () => {
    try {
      if (matKhau !== nhapLaiMatKhau) {
        Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp");
        return;
      }
      // const checkParams = {
      //   TableName: "Users",
      //   Key: {
      //     soDienThoai: soDienThoai,
      //   },
      // };

      // const checkResult = await dynamoDB.get(checkParams).promise();

      // // Nếu số điện thoại đã tồn tại, hiển thị cảnh báo và không thực hiện đăng ký
      // if (checkResult.Item) {
      //   Alert.alert("Lỗi", "Số điện thoại đã được đăng ký trước đó");
      //   return;
      // }

      const dynamoDB = new DynamoDB.DocumentClient({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });
      // Tạo item để ghi vào DynamoDB
      const params = {
        TableName: "Users",
        Item: {
          soDienThoai: soDienThoai,
          hoTen: hoTen,
          matKhau: matKhau,
        },
      };

      // Ghi dữ liệu vào DynamoDB
      await dynamoDB.put(params).promise();
      alert("Đăng ký thành công");
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      alert("Đăng ký thất bại");
    }
  };

  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <LinearGradient
        colors={["#4AD8C7", "#B728A9"]}
        style={styles.background}
      >
    <View style={styles.container}>
      
      <View style={styles.logo}>
        <Text style={styles.txtLogo}>4MChat</Text>
      </View>
      <Text
        style={{
          color: "#F5EEEE",
          fontSize: 40,
          fontWeight: "bold",
        }}
      >
        Đăng ký
      </Text>
      <TextInput
        style={{ ...styles.inputHoTen, color: "#000" }}
        placeholder="Họ và Tên"
        onChangeText={(text) => setHoTen(text)}
      />
      <TextInput
        style={{ ...styles.inputSDT, color: "#000" }}
        placeholder="Số điện thoại"
        onChangeText={(text) => setSoDienThoai(text)}
      />
      <TextInput
        style={{ ...styles.inputPass, color: "#000" }}
        placeholder="Mật khẩu"
        secureTextEntry={true}
        onChangeText={(text) => setMatKhau(text)}
      />
      <TextInput
style={{ ...styles.inputConfirmPass, color: "#000" }}
        placeholder="Nhập lại mật khẩu"
        secureTextEntry={true}
        onChangeText={(text) => setNhapLaiMatKhau(text)}
      />
      <Pressable style={styles.btnSignUp} onPress={signUp}>
        <Text style={styles.txtSignUp}>Đăng Ký</Text>
      </Pressable>
      
    </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent:"center",
    alignItems: "center",
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
    marginTop: 48,
  },
  inputHoTen: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 36,
  },
  inputSDT: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 30,
  },
  inputPass: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 30,
  },
  inputConfirmPass: {
    width: 318,
    height: 46,
    backgroundColor: "rgba(255, 255, 255, 0.80)",
    color: "#BCB2B2",
    fontSize: 16,
    borderRadius: 10,
    paddingLeft: 10,
    marginTop: 30,
  },
  btnSignUp: {
    width: 200,
    height: 50,
    borderRadius: 13,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  txtSignUp: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default SignUpForm;