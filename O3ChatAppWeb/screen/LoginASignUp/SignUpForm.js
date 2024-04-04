import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, Pressable, Alert, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DynamoDB,S3 } from "aws-sdk";
import { useFonts } from "expo-font";
import { useNavigation } from '@react-navigation/native'; // Import thư viện useNavigation
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import * as ImagePicker from 'expo-image-picker';

const SignUpForm = () => {
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");
  const [imageUri, setImageUri] = useState(null);

  const navigation = useNavigation(); // Sử dụng hook useNavigation để lấy đối tượng navigation

  const signUp = async () => {
    try {
      if (matKhau !== nhapLaiMatKhau) {
        alert("Lỗi", "Mật khẩu nhập lại không khớp");
        return;
      }
      if (!imageUri) {
        alert("Vui lòng chọn ảnh đại diện");
        return;
      }
      
      const imageUrl = await uploadImageToS3(imageUri);
      if (!imageUrl) {
        alert("Lỗi khi tải ảnh lên S3");
        return;
      }
      const dynamoDB = new DynamoDB.DocumentClient({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });
     
      const params = {
        TableName: "Users",
        Item: {
          soDienThoai: soDienThoai,
          hoTen: hoTen,
          matKhau: matKhau,
          avatarUrl: imageUrl
        },
      };

      await dynamoDB.put(params).promise();
      alert("Đăng ký thành công");
      
      navigation.navigate('LoginForm'); // Chuyển hướng đến màn hình đăng nhập sau khi đăng ký thành công
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      alert("Đăng ký thất bại");
    }
  };
  const uploadImageToS3 = async (fileUri) => {
    const s3 = new S3({
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
      region: REGION,
    });

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const params = {
      Bucket: "longs3",
      Key: "avatar_" + new Date().getTime() + ".jpg", // Đổi tên file thành một tên duy nhất
      Body: blob,
      ContentType: "image/jpeg/jfif", // Định dạng của file
    };

    try {
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên S3:", error);
      return null;
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });
  
  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <LinearGradient colors={["#4AD8C7", "#B728A9"]} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.txtLogo}>4MChat</Text>
        </View>
        <Text style={{ color: "#F5EEEE", fontSize: 40, fontWeight: "bold" }}>Đăng ký</Text>
        <View style={styles.imageContainer}>
        <Pressable onPress={pickImage}>
          <Text style={{ paddingVertical: 10,paddingHorizontal: 20, color: '#FFF' ,marginTop:20,borderRadius:30,backgroundColor:"rgba(117, 40, 215, 0.47)"}}>Chọn ảnh</Text>
        </Pressable>
        {imageUri && <Image source={{ uri: imageUri }} style={{ marginLeft:30,width: 70, height: 70,borderRadius: 30, marginTop: 20 }} />}
        </View>
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
  imageContainer: {
    flexDirection: 'row', // Sắp xếp các phần tử theo hàng ngang
    alignItems: 'center', // Căn chỉnh các phần tử theo chiều dọc
  },
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
    margintop:20,
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
    marginTop: 30,
  },
  txtSignUp: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default SignUpForm;
