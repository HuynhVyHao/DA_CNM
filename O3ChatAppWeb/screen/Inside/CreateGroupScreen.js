import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Alert,
  BackHandler,
  Dimensions,
} from "react-native";
import IconAnt from "react-native-vector-icons/AntDesign";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { DynamoDB, S3 } from "aws-sdk";
import { useFocusEffect } from "@react-navigation/native";

import {
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  REGION,
  S3_BUCKET_NAME,
  DYNAMODB_TABLE_NAME,
} from "@env";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");

const CreateGroupScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [fontsLoaded] = useFonts({
    "keaniaone-regular": require("../../assets/fonts/KeaniaOne-Regular.ttf"),
  });
  const [friends, setFriends] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarGroup);
  const [fileType, setFileType] = useState("");
  const bucketName = S3_BUCKET_NAME;
  const [isAvatarSelected, setIsAvatarSelected] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState({});
  const [groupChats, setGroupChats] = useState([]);
  const groupNameRef = useRef(null);
  const [groupName, setGroupName] = useState(""); // Thêm state cho groupName

  const tableName = DYNAMODB_TABLE_NAME;

  const dynamoDB = new DynamoDB.DocumentClient({
    region: REGION,
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  });

  const fetchFriends = async () => {
    try {
      const getFriendsParams = {
        TableName: "Friends",
        Key: { senderEmail: user?.email }, // Assuming user is defined somewhere
      };
      const friendData = await dynamoDB.get(getFriendsParams).promise();

      if (friendData.Item && friendData.Item.friends) {
        const friendEmails = friendData.Item.friends.map(
          (friend) => friend.email
        );

        // Array to store friend details
        const friendDetails = [];

        // Loop through friend emails
        for (const friendEmail of friendEmails) {
          // Get friend's details from Users table
          const getUserParams = {
            TableName: "Users",
            Key: { email: friendEmail },
          };
          const userData = await dynamoDB.get(getUserParams).promise();

          // If user data exists, push it to friendDetails array
          if (userData.Item) {
            friendDetails.push(userData.Item);
          }
        }

        // Now friendDetails array contains details of all friends
        // Set friends with the details from Users table
        setFriends(friendDetails);
      } else {
        // If no friends found, set friends to an empty array
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends data:", error);
    }
  };
  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  const pickAvatar = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0].uri.split(".");
        const fileType = image[image.length - 1];

        setAvatarUrl(result.assets[0].uri);
        setFileType(fileType);
        setIsAvatarSelected(true);
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh đại diện:", error);
      alert("Lỗi! Không thể chọn ảnh đại diện");
    }
  };

  const uploadAvatar = async (avatarUrl) => {
    try {
      let contentType = "";
      switch (fileType) {
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg";
          break;
        case "png":
          contentType = "image/png";
          break;
        case "gif":
          contentType = "image/gif";
          break;
        default:
          contentType = "application/octet-stream";
      }
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      const filePath = `${user?.email}_${Date.now().toString()}.${fileType}`;

      const s3 = new S3({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });

      const paramsS3 = {
        Bucket: S3_BUCKET_NAME,
        Key: filePath,
        Body: blob,
        ContentType: contentType,
        ContentLength: blob.size,
      };

      const data = await s3.upload(paramsS3).promise();
      setAvatarUrl(data.Location);
    } catch (error) {
      console.error("Lỗi khi tải lên ảnh đại diện:", error);
      alert("Lỗi! Không thể tải lên ảnh đại diện");
      return null;
    }
  };

  // const updateGroupAvatar = async (avatarUrl) => {
  //   try {
  //     const dynamoDB = new DynamoDB.DocumentClient({
  //       region: REGION,
  //       accessKeyId: ACCESS_KEY_ID,
  //       secretAccessKey: SECRET_ACCESS_KEY,
  //     });

  //     const paramsDynamoDb = {
  //       TableName: tableName,
  //       Key: { email: user.email },
  //       UpdateExpression: "set avatarGroup = :avatar",
  //       ExpressionAttributeValues: {
  //         ":avatar": avatarUrl,
  //       },
  //       ReturnValues: "UPDATED_NEW",
  //     };

  //     await dynamoDB.update(paramsDynamoDb).promise();

  //     setAvatarUrl(avatarUrl);

  //     //alert("Thành công! Ảnh đại diện đã được cập nhật!");
  //   } catch (error) {
  //     console.error("Lỗi khi cập nhật dữ liệu người dùng:", error);
  //     //alert("Lỗi! Không thể cập nhật dữ liệu người dùng");
  //   }
  // };

  const handleSelectFriend = (index) => {
    setSelectedFriends((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const checkMinimumSelectedMembers = () => {
    const selectedCount = Object.values(selectedFriends).filter(
      (selected) => selected
    ).length;
    return selectedCount >= 2;
  };

  const createGroup = async () => {
    if (checkMinimumSelectedMembers()) {
      try {
        const groupId = `${user.email}_${Date.now().toString()}`;
        const groupNameValue = groupName;
        const selectedFriendsEmail = Object.keys(selectedFriends)
          .filter((index) => selectedFriends[index])
          .map((index) => friends[index].email);

        // Thêm người tạo nhóm vào danh sách thành viên
        const groupMembers = [...selectedFriendsEmail, user.email];

        const groupData = {
          groupId: groupId,
          members: groupMembers,
          groupName: groupNameValue,
          avatarGroup: avatarUrl || "",
          messages: [],
          roles: {}, // Khởi tạo roles
        };

        // Thiết lập vai trò cho người tạo nhóm
        groupData.roles[user.email] = "Trưởng nhóm";

        // Thiết lập vai trò cho các thành viên
        selectedFriendsEmail.forEach((email) => {
          if (email !== user.email) {
            groupData.roles[email] = "Thành viên";
          }
        });

        const putParams = {
          TableName: "GroupChats",
          Item: groupData,
        };

        await dynamoDB.put(putParams).promise();

        navigation.navigate("HomeScreen", { groups: groupData, user });
      } catch (error) {
        console.error("Lỗi khi tạo nhóm:", error);
        alert("Lỗi!Không thể tạo nhóm");
      }
    } else {
      alert("Thông báo!Bạn cần chọn ít nhất 2 thành viên để tạo nhóm.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.modalContainer}>
          <View style={styles.upperHeaderPlaceholer} />
          <View style={styles.header}>
            <Text
              style={{
                fontSize: 18,
                textAlign: "center",
                alignItems: "center",
              }}
            >
              Tạo Nhóm Mới
            </Text>
          </View>
          <View style={styles.paddingForHeader} />
          <View style={styles.viewContent}>
            <LinearGradient
              colors={["#4AD8C7", "#B728A9"]}
              style={styles.background}
            />
            <View style={styles.infoPersonal}>
              <View style={{ flexDirection: "row", marginTop: 20 }}>
                <Pressable onPress={pickAvatar}>
                  {isAvatarSelected ? (
                    <Image
                      style={{ width: 40, height: 40, borderRadius: 25 }}
                      source={
                        avatarUrl
                          ? { uri: avatarUrl }
                          : require("../../assets/img/iconGroupScreen/no-avatar.jpg")
                      }
                    />
                  ) : (
                    <IconAnt name="camerao" size={40} color="black" />
                  )}
                </Pressable>
                <View style={{ marginLeft: 10, flexDirection: "row" }}>
                  <TextInput
                    ref={groupNameRef}
                    style={[
                      styles.textInput,
                      isInputFocused && styles.textInputFocused,
                    ]}
                    placeholder="Tên Nhóm"
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChangeText={(text) => setGroupName(text)} // Thêm hàm onChangeText để cập nhật giá trị tên nhóm
                  />
                </View>
              </View>
              <View>
                <View
                  style={{
                    width: "95%",
                    borderRadius: 10,
                    flexDirection: "row",
                    backgroundColor: "#DDDDDD",
                    marginTop: 20,
                  }}
                >
                  <IconAnt
                    name="search1"
                    size={25}
                    color={"#fff"}
                    style={{ marginLeft: 10, marginTop: 3 }}
                  />
                  <TextInput
                    placeholder="Tìm kiếm theo tên hoặc số điện thoại"
                    placeholderTextColor={"#fff"}
                    style={{
                      width: "90%",
                      height: 30,
                      color: "#000",
                      fontSize: 16,
                      borderRadius: 10,
                      paddingLeft: 10,
                    }}
                  />
                </View>
                <Text style={styles.pickMember}>Chọn Thành Viên</Text>
              </View>
            </View>
            <View style={styles.contactPhone}>
              {friends.length > 0 ? (
                friends.map((friend, index) => (
                  <Pressable
                    key={index}
                    style={styles.infoMenu}
                    onPress={() => handleSelectFriend(index)}
                  >
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selectedFriends[index]
                              ? "black"
                              : "#ccc",
                          },
                        ]}
                      >
                        {selectedFriends[index] ? (
                          <Icon name="check" size={18} color="black" />
                        ) : null}
                      </View>
                    </View>
                    <Image
                      style={styles.avatarImage}
                      source={{ uri: friend.avatarUser }}
                    />
                    <Text style={styles.txtUser}>{friend.hoTen}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.txtUser}>Không có bạn bè</Text>
              )}
              <Pressable style={styles.createGroupButton} onPress={createGroup}>
                <Text style={styles.createGroupButtonText}>Tạo Nhóm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <Pressable style={styles.btnBack} onPress={() => navigation.goBack()}>
        <Text style={styles.txtBack}>Quay lại</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContainer: {
    flexGrow: 1,
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
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
  viewContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  infoPersonal: {
    height: 170,
    fontSize: 16,
    paddingLeft: 10,
    borderWidth: 1,
    backgroundColor: "white",
    borderColor: "#ccc",
  },
  contactPhone: {
    flex: 1,
    backgroundColor: "white",
  },
  textInput: {
    fontSize: 18,
    width: "90%",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  textInputFocused: {
    borderBottomColor: "#00f",
  },
  pickMember: {
    marginTop: 20,
    fontSize: 20,
    textAlign: "center",
    width: 200,
    alignSelf: "center",
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignSelf: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignSelf: "center",
  },
  createGroupButton: {
    backgroundColor: "#4AD8C7",
    width: "90%",
    height: 50,
    borderRadius: 25,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  createGroupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 25,
    marginLeft: 13,
  },
  txtUser: {
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
  infoMenu: {
    height: 65,
    flexDirection: "row",
    borderColor: "#ccc",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  btnBack: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
  },
  txtBack: {
    color: "#FFF",
    fontSize: 16,
  },
});

export default CreateGroupScreen;
