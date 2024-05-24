import React, { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import FriendScreen from "./FriendScreen";
import Screen2 from "./Screen2";
import IconAnt from "react-native-vector-icons/AntDesign";
import GroupChats from "./GroupChats";
import BoxChat from "./BoxChat"; // Import BoxChat component

//import Icon from "react-native-vector-icons/AntDesign";
import { DynamoDB, S3 } from "aws-sdk";
//import LoginForm from "../LoginASignUp/LoginForm";
import {
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  REGION,
  S3_BUCKET_NAME,
  DYNAMODB_TABLE_NAME,
} from "@env";

const HomeScreen = ({ navigation, route }) => {
  const { user, friend } = route.params;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalSetting] = useState(false);
  const [modalVisible3, setModalKetban] = useState(false);
  const [avatarUri, setAvatarUri] = useState(
    user
      ? user.avatarUser
      : require("../../assets/img/iconHomeScreen/Avatar.png")
  );
  const [timKiem, setTimKiem] = useState("");
  const [searchText, setSearchText] = useState("");
  const [username, setUsername] = useState(user ? user.hoTen : "");
  const [birthday, setBirthday] = useState(user ? user.ngaySinh : "");
  const [gender, setGender] = useState(user ? user.gioiTinh : "");
  const [email, setEmail] = useState("");
  const [phoneUser, setPhoneUser] = useState(user ? user.soDienThoai : "");
  const [select, setSelect] = useState(1);
  const [boxChatData, setBoxChatData] = useState(null);
  const [boxChatGroupData, setBoxChatGroupData] = useState(null);
  const [sentRequests, setSentRequests] = useState({});
  const closeBoxChat = () => {
    // Đóng hộp thoại
    setBoxChatData(null);
  };
  const closeBoxChatGroup = () => {
    // Đóng hộp thoại
    setBoxChatGroupData(null);
  };
  const showBoxChatInRightBar = (friend, user) => {
    setBoxChatData({ friend, user });
  };

  const showGroupChatInRightBar = (group, user) => {
    setBoxChatGroupData({ group, user });
  };
  const addFriend = async (friendPhoneNumber) => {
    try {
      const params = {
        TableName: "FriendRequest",
        Key: { email: email },
        UpdateExpression:
          "SET friendRequests = list_append(if_not_exists(friendRequests, :empty_list), :request)",
        ExpressionAttributeValues: {
          ":request": [
            {
              email: user?.email,
              hoTen: user?.hoTen,
              avatarUser: user?.avatarUser,
            },
          ],
          ":empty_list": [],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      // alert(`Đã gửi yêu cầu kết bạn đến số điện thoại ${friendPhoneNumber}`);
      setSentRequests((prevState) => ({
        ...prevState,
        [friendPhoneNumber]: true,
      }));
    } catch (error) {
      console.error("Error sending friend request:", error);
      // Handle error
    }
  };

  const logout = () => {
    // Thực hiện xử lý đăng xuất ở đây, ví dụ chuyển hướng về trang đăng nhập
    navigation.navigate("LoginForm"); // Đây là một ví dụ, bạn cần điều chỉnh chuyển hướng theo cách bạn thích
  };
  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });

  const searchUserByPhoneNumber = async (email) => {
    if (email === user.email) {
      // Nếu số điện thoại nhập vào trùng với số điện thoại của người dùng đang đăng nhập
      setModalVisible(true); // Mở modal hiển thị thông tin cá nhân của người dùng
      setModalKetban(false);
      return;
    }

    const params = {
      TableName: "Users",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    try {
      const data = await dynamoDB.query(params).promise();
      setSearchText(data.Items);
    } catch (error) {
      console.error("Error searching user by phone number:", error);
      throw error;
    }
  };

  const selectAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setAvatarUri(result.uri);
    }
  };

  const updateProfile = async () => {
    try {
      if (!username || !birthday || !gender || !phoneUser) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
      }
      let avatarUrl = user.avatarUser; // Giữ nguyên avatarUrl nếu không có hình ảnh mới

      // Nếu có hình ảnh mới được chọn, upload lên S3
      if (avatarUri) {
        const file = {
          uri: avatarUri,
          name: "avatar.jpg",
          type: "image/jpeg/png/jfif/jpg",
        };
        const data = await fetch(avatarUri);
        console.log("data", data);
        const blob = await data.blob();
        const uploadParams = {
          Bucket: "longs3",
          Key: "avatar_" + new Date().getTime() + ".jpg",
          Body: blob,
          ContentType: "image/jpeg",
          ACL: "public-read",
        };
        const s3 = new S3({
          region: REGION,
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
        });
        const response = await s3.upload(uploadParams).promise();

        if (!response.Location) {
          console.error("Failed to upload image to S3", response);
          return;
        }

        console.log("Successfully uploaded image to S3", response.Location);
        avatarUrl = response.Location;
      }
      const params = {
        TableName: "Users",
        Key: {
          email: user.email,
        },
        UpdateExpression:
          "SET hoTen = :hoTen, avatarUser = :avatarUrl, ngaySinh = :ngaySinh, gioiTinh = :gioiTinh, soDienThoai = :soDienThoai",
        ExpressionAttributeValues: {
          ":hoTen": username,
          ":avatarUrl": avatarUrl,
          ":ngaySinh": birthday,
          ":gioiTinh": gender,
          ":soDienThoai": phoneUser,
        },
        ReturnValues: "UPDATED_NEW",
      };
      const response = await dynamoDB.update(params).promise();
      alert("Dữ liệu đã được cập nhật thành công:", response);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin");
    }
  };
  return (
    <LinearGradient colors={["#4AD8C7", "#B728A9"]} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Pressable onPress={() => setModalVisible(true)}>
            <Image source={avatarUri} style={styles.imgUser} />
          </Pressable>
          <Pressable
            onPress={() => setSelect(1)}
            style={[styles.tabItem, select === 1]}
          >
            <Image
              source={require("../../assets/img/iconHomeScreen/icons8-chat-30 (1) 1.png")}
              style={styles.imgChat}
            />
          </Pressable>
          <Pressable
            onPress={() => setSelect(2)}
            style={[styles.tabItem, select === 2]}
          >
            <Image
              source={require("../../assets/img/iconHomeScreen/icons8-phonebook-24 1.png")}
              style={styles.imgPhoneBook}
            />
          </Pressable>
          <Pressable onPress={() => setModalSetting(true)}>
            <Image
              source={require("../../assets/img/iconHomeScreen/icons8-setting-50 (1) 1.png")}
              style={styles.imgSetting}
            />
          </Pressable>
        </View>

        <View style={styles.Vertical} />

        <View style={styles.middle}>
          <View style={styles.tabMiddle}>
            <View style={styles.Input}>
              <Pressable>
                <Image
                  source={require("../../assets/img/iconHomeScreen/search 1.png")}
                  style={styles.imgSearch}
                />
              </Pressable>
              <TextInput
                style={styles.txtSearch}
                placeholder="Tìm kiếm"
                onChangeText={(text) => setTimKiem(text)}
                value={timKiem}
              />
            </View>
            <Pressable
              onPress={() => setModalKetban(true)}
              style={styles.pressableContainer}
            >
              <IconAnt name="adduser" size="40px" color="black" />
            </Pressable>
            <Pressable
              style={styles.pressableContainer2}
              onPress={() => navigation.navigate("CreateGroupScreen", { user })}
            >
              <IconAnt name="addusergroup" size="40px" color="black" />
            </Pressable>
          </View>
          <View style={styles.divider} />
          <SafeAreaView style={styles.screenContainer}>
            {select === 1 ? (
              <Screen2
                user={user}
                showBoxChatInRightBar={showBoxChatInRightBar}
                showGroupChatInRightBar={showGroupChatInRightBar}
              />
            ) : (
              <FriendScreen
                user={user}
                showBoxChatInRightBar={showBoxChatInRightBar}
              />
            )}
          </SafeAreaView>
        </View>
        <View style={styles.dividerVertical} />

        <SafeAreaView style={styles.chatScreen}>
          {boxChatData && (
            <BoxChat
              friend={boxChatData.friend}
              user={boxChatData.user}
              onClose={closeBoxChat}
            />
          )}
          {boxChatGroupData && (
            <GroupChats
              user={boxChatGroupData.user}
              group={boxChatGroupData.group}
              onClose={closeBoxChatGroup}
            />
          )}
        </SafeAreaView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Pressable
              style={styles.closeButtonContainer}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>X</Text>
            </Pressable>
            <Text style={styles.modalText}>Thông tin cá nhân</Text>
            <Pressable onPress={selectAvatar}>
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Image source={avatarUri} style={styles.userAvatar} />
                <Text>{user.email}</Text>
              </View>
            </Pressable>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Tên tài khoản :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Tên tài khoản"
                value={username}
                onChangeText={(text) => setUsername(text)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Ngày Sinh :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ngày sinh"
                value={birthday}
                onChangeText={(text) => setBirthday(text)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Giới Tính :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Giới tính"
                value={gender}
                onChangeText={(text) => setGender(text)}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.infoTitle}>Số Điện Thoại :</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Số điện thoại"
                value={phoneUser}
                onChangeText={(text) => setPhoneUser(text)}
              />
            </View>
            <Pressable
              style={[styles.button, styles.updateButton]}
              onPress={updateProfile}
            >
              <Text style={styles.textStyleUD}>Cập Nhật</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalSetting(!modalVisible2);
        }}
      >
        <View style={styles.viewSetting}>
          <View style={styles.modalSetting}>
            <Pressable
              style={styles.closeButtonContainer}
              onPress={() => setModalSetting(!modalVisible2)}
            >
              <Text style={styles.textStyle}>X</Text>
            </Pressable>
            <Pressable onPress={logout}>
              <Text style={styles.modalText2}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible3}
        onRequestClose={() => {
          alert("Modal has been closed.");
          setModalKetban(!modalVisible3);
        }}
      >
        <View style={styles.viewKetban}>
          <View style={styles.modalKetban}>
            <Text style={styles.title}>Thêm bạn</Text>
            <Pressable
              style={styles.closeButtonContainer}
              onPress={() => setModalKetban(!modalVisible3)}
            >
              <Text style={styles.textStyle}>X</Text>
            </Pressable>
            <View style={styles.Inputsdt}>
              <TextInput
                style={styles.txtSearch}
                placeholder="Nhập Email"
                onChangeText={(text) => setEmail(text)}
                value={email}
              />
            </View>
            <Pressable
              style={styles.btnThemban}
              onPress={() => searchUserByPhoneNumber(email)}
            >
              <Text style={styles.modalText3}>Tìm kiếm</Text>
            </Pressable>
            {searchText && (
              <View style={styles.searchResultContainer}>
                {searchText.map((user, index) => (
                  <View key={index} style={styles.userItem}>
                    <Image
                      source={{ uri: user.avatarUser }}
                      style={styles.avatar}
                    />
                    <Text style={styles.userName}>{user.hoTen}</Text>
                    <Pressable
                      style={[
                        styles.addButton,
                        sentRequests[user.email] && styles.disabledButton,
                      ]}
                      onPress={() => addFriend(user.email)}
                      disabled={sentRequests[user.email]}
                    >
                      <Text style={styles.addButtonText}>
                        {sentRequests[user.email] ? "Đã gửi" : "Kết bạn"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    marginLeft: 20,
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: "white",
  },
  disabledButton: {
    backgroundColor: "#ccc", // màu xám hoặc bất kỳ màu nào để hiển thị nút bị vô hiệu hóa
  },
  searchResultContainer: {
    marginTop: 20,
  },
  Inputsdt: {
    width: 250,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-evenly",
    marginLeft: 15,
  },
  viewKetban: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalKetban: {
    margin: 20,
    height: 500,
    width: 400,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    position: "absolute",
    top: 10,
    left: 15,
    marginRight: 30,
  },
  viewThemban: {
    flexDirection: "row",
    marginTop: 15,
  },
  modalText3: {
    textAlign: "center",
  },
  btnThemban: {
    borderRadius: 5,
    weight: 50,
    height: 30,
    backgroundColor: "rgba(117, 40, 215, 0.47)",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    right: 15,
  },
  pressableContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  pressableContainer2: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },

  viewSetting: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalSetting: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    height: 500,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  textStyle: {
    backgroundColor: "white",
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
  },
  textStyleUD: {
    backgroundColor: "#4AD8C7",
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalText2: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    color: "red",
  },
  container: {
    flex: 1,
    flexDirection: "row",
  },
  background: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  imgUser: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  imgChat: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  imgPhoneBook: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  imgSetting: {
    marginTop: 30,
    width: 50,
    height: 50,
  },
  Vertical: {
    width: 1,
    height: "100%",
    backgroundColor: "gray",
    marginLeft: 15,
  },
  dividerVertical: {
    width: 1,
    height: "100%",
    backgroundColor: "gray",
  },
  middle: {
    backgroundColor: "white",
    width: 400,
  },
  chatScreen: {
    flex: 1,
    width: 700,
  },
  chatInfo: {
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 30,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imgSearch: {
    width: 20,
    height: 20,
    marginLeft: 10,
    marginTop: 15,
    alignItems: "center",
  },
  imgAdd: {
    width: 29,
    height: 30,
    marginLeft: 15,
    marginTop: 10,
  },
  txtSearch: {
    fontSize: 20,
  },
  Input: {
    width: 290,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    flexDirection: "row",
    height: 50,
    justifyContent: "space-evenly",
    marginLeft: 15,
  },
  tabMiddle: {
    flexDirection: "row",
    marginTop: 20,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#8C8787",
    marginTop: 10,
  },
  inputField: {
    flex: 1, // Đặt ô nhập văn bản để mở rộng để lấp đầy không gian còn lại
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  infoTitle: {
    fontWeight: "bold",
    marginRight: 10,
  },
  updateButton: {
    backgroundColor: "#4AD8C7",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
  },
});
