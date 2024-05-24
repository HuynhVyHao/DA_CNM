import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import AWS from "aws-sdk";
import { useFocusEffect } from "@react-navigation/native";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import IconAnt from "react-native-vector-icons/AntDesign";

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: REGION,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const FriendScreen = ({ navigation, user, showBoxChatInRightBar }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUser = async () => {
    try {
      // Replace "YOUR_USER_ID" with the actual user ID or key
      const params = {
        TableName: "Users",
        Key: { email: user.email },
      };
      const userData = await dynamoDB.get(params).promise();
      if (userData && userData.Item) {
        setUser(userData.Item);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const params = {
        TableName: "Friends",
        Key: { senderEmail: user.email },
      };
      const friendData = await dynamoDB.get(params).promise();
      if (friendData.Item && friendData.Item.friends) {
        setFriends(friendData.Item.friends);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const getFriendRequestsParams = {
        TableName: "FriendRequest",
        Key: { email: user?.email },
      };
      const friendRequestsData = await dynamoDB
        .get(getFriendRequestsParams)
        .promise();

      if (friendRequestsData.Item && friendRequestsData.Item.friendRequests) {
        setFriendRequests(friendRequestsData.Item.friendRequests);
      } else {
        setFriendRequests([]);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, [user]);

  const handleAcceptFriendRequest = async (friendRequest) => {
    try {
      // Lấy danh sách bạn bè của người gửi lời mời từ cơ sở dữ liệu
      const getSenderFriendsParams = {
        TableName: "Friends",
        Key: { senderEmail: friendRequest.email },
      };
      const senderFriendData = await dynamoDB
        .get(getSenderFriendsParams)
        .promise();

      // Cập nhật danh sách bạn bè của người gửi lời mời
      let updatedSenderFriends = [];
      if (!senderFriendData.Item) {
        updatedSenderFriends = [user];
      } else {
        updatedSenderFriends = [...(senderFriendData.Item.friends || []), user];
      }
      const updateSenderFriendEntry = {
        TableName: "Friends",
        Key: { senderEmail: friendRequest.email },
        UpdateExpression: "set friends = :friends",
        ExpressionAttributeValues: { ":friends": updatedSenderFriends },
      };
      await dynamoDB.update(updateSenderFriendEntry).promise();

      // Lấy danh sách bạn bè của người nhận lời mời từ cơ sở dữ liệu
      const getReceiverFriendsParams = {
        TableName: "Friends",
        Key: { senderEmail: user?.email },
      };
      const receiverFriendData = await dynamoDB
        .get(getReceiverFriendsParams)
        .promise();

      // Cập nhật danh sách bạn bè của người nhận lời mời
      let updatedReceiverFriends = [];
      if (!receiverFriendData.Item) {
        updatedReceiverFriends = [friendRequest];
      } else {
        updatedReceiverFriends = [
          ...(receiverFriendData.Item.friends || []),
          friendRequest,
        ];
      }
      const updateReceiverFriendEntry = {
        TableName: "Friends",
        Key: { senderEmail: user?.email },
        UpdateExpression: "set friends = :friends",
        ExpressionAttributeValues: { ":friends": updatedReceiverFriends },
      };
      await dynamoDB.update(updateReceiverFriendEntry).promise();

      // Xóa lời mời kết bạn đã được chấp nhận khỏi danh sách lời mời kết bạn

      const getRequestParams = {
        TableName: "FriendRequest",
        Key: { email: user?.email },
      };
      const requestResult = await dynamoDB.get(getRequestParams).promise();

      if (!requestResult.Item || !requestResult.Item.friendRequests) {
        // Không có dữ liệu hoặc không có mảng friendRequests, không cần xóa
        return;
      }

      // Lọc ra mảng friendRequests mới mà không chứa friendRequest cần xóa
      const updatedFriendRequests = requestResult.Item.friendRequests.filter(
        (request) => request.email !== friendRequest.email
      );

      // Cập nhật lại mảng friendRequests mới vào cơ sở dữ liệu
      const updateParams = {
        TableName: "FriendRequest",
        Key: { email: user?.email },
        UpdateExpression: "SET friendRequests = :updatedRequests",
        ExpressionAttributeValues: {
          ":updatedRequests": updatedFriendRequests,
        },
      };
      await dynamoDB.update(updateParams).promise();
      // Cập nhật lại danh sách bạn bè và danh sách lời mời kết bạn
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectFriendRequest = async (friendRequest) => {
    try {
      // Lấy danh sách friendRequests từ cơ sở dữ liệu
      const getRequestParams = {
        TableName: "FriendRequest",
        Key: { email: user?.email },
      };
      const requestResult = await dynamoDB.get(getRequestParams).promise();

      if (!requestResult.Item || !requestResult.Item.friendRequests) {
        // Không có dữ liệu hoặc không có mảng friendRequests, không cần xóa
        return;
      }

      // Lọc ra mảng friendRequests mới mà không chứa friendRequest cần xóa
      const updatedFriendRequests = requestResult.Item.friendRequests.filter(
        (request) => request.email !== friendRequest.email
      );

      // Cập nhật lại mảng friendRequests mới vào cơ sở dữ liệu
      const updateParams = {
        TableName: "FriendRequest",
        Key: { email: user?.email },
        UpdateExpression: "SET friendRequests = :updatedRequests",
        ExpressionAttributeValues: {
          ":updatedRequests": updatedFriendRequests,
        },
      };
      await dynamoDB.update(updateParams).promise();

      // Cập nhật lại danh sách lời mời kết bạn
      fetchFriendRequests();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleChatWithFriend = async (friend, user) => {
    try {
      if (!friend || !friend.email || !user || !user.email) {
        console.error("Invalid friend or user information");
        return;
      }
      // Kiểm tra xem hộp thoại hiện tại có phải là hộp thoại cũ email
      // Tạo khóa kết hợp từ số điện thoại của người gửi và người nhận
      const senderReceiverKey = `${user.email}_${friend.email}`;
      const receiverSenderKey = `${friend.email}_${user.email}`;

      // Kiểm tra xem box chat đã tồn tại với khóa senderReceiverKey hoặc receiverSenderKey chưa
      const existingChatParams = {
        RequestItems: {
          BoxChats: {
            Keys: [
              { senderEmail: senderReceiverKey },
              { senderEmail: receiverSenderKey },
            ],
          },
        },
      };
      const existingChatData = await dynamoDB
        .batchGet(existingChatParams)
        .promise();

      // Kiểm tra nếu không có dữ liệu hoặc dữ liệu không đúng định dạng

      if (
        !existingChatData ||
        !existingChatData.Responses ||
        !existingChatData.Responses["BoxChats"]
      ) {
        console.error("Invalid chat data format");
        return;
      }

      // Nếu có box chat cho cả hai khóa, chuyển đến màn hình BoxChat
      if (existingChatData.Responses["BoxChats"].length > 0) {
        showBoxChatInRightBar(friend, user);
        return;
      }

      // Nếu không tìm thấy box chat cho cả hai khóa, tạo mới
      // Tạo box chat cho người gửi
      const senderChatParams = {
        RequestItems: {
          BoxChats: [
            {
              PutRequest: {
                Item: {
                  senderEmail: senderReceiverKey,
                  receiverEmail: friend.email,
                  messages: [],
                  // Thêm thông tin của người nhận vào box chat của người gửi
                  receiverInfo: {
                    email: friend.email,
                    hoTen: friend.hoTen,
                    avatarUrl: friend.avatarUrl,
                  },
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  senderEmail: receiverSenderKey,
                  receiverEmail: user.email,
                  messages: [],
                  // Thêm thông tin của người gửi vào box chat của người nhận
                  receiverInfo: {
                    email: user.email,
                    hoTen: user.hoTen,
                    avatarUrl: user.avatarUrl,
                  },
                },
              },
            },
          ],
        },
      };
      await dynamoDB.batchWrite(senderChatParams).promise();

      // Chuyển đến màn hình BoxChat với thông tin của người bạn
      showBoxChatInRightBar(friend, user);
    } catch (error) {
      console.error("Error handling chat with friend:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
      fetchFriendRequests();
    }, [navigation])
  );
  useEffect(() => {
    fetchUser();
  }, []);
  // Rest of your code
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: "white",
          height: 50,
          borderWidth: 1,
          borderColor: "black",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "normal",
            textAlign: "left",
            fontSize: 20,
            marginLeft: 10,
          }}
        >
          Lời mời kết bạn
        </Text>
      </Pressable>

      {/* Modal hiển thị danh sách lời mời kết bạn */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Danh sách lời mời kết bạn</Text>
            <FlatList
              data={friendRequests}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderRadius: 10,
                    height: 60,
                    width: 500,
                    alignItems: "center",
                    padding: 3,
                  }}
                >
                  <Image
                    style={{
                      width: 50,
                      height: 50,
                      borderWidth: 1,
                      borderColor: "#000",
                      borderRadius: 24,
                    }}
                    source={{ uri: item.avatarUser }}
                  />
                  <Text
                    style={{
                      color: "#000",
                      textAlign: "center",
                      marginLeft: 5,
                      fontSize: 18,
                      marginRight: 25,
                      fontWeight: "bold",
                    }}
                  >
                    {item.hoTen}
                  </Text>
                  <Pressable onPress={() => handleAcceptFriendRequest(item)}>
                    <IconAnt name="checkcircle" size={30} color={"green"} />
                  </Pressable>
                  <Pressable
                    style={{ marginLeft: 20 }}
                    onPress={() => handleRejectFriendRequest(item)}
                  >
                    <IconAnt name="closecircle" size={30} color={"red"} />
                  </Pressable>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal hiển thị thông tin chi tiết và nút chấp nhận/từ chối lời mời kết bạn */}
      <View style={styles.contactPhone}>
        <ScrollView>
          {friends.length > 0 ? (
            friends.map((friend, index) => (
              <Pressable
                onPress={() => handleChatWithFriend(friend, user)}
                key={index}
                style={styles.infoMenu}
              >
                <Image
                  style={styles.avatarImage}
                  source={{ uri: friends.avatarUser }}
                />
                <Text style={styles.txtUser}>{friends.hoTen}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.txtUser}>Không có bạn bè</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default FriendScreen;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "50%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  requestItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  closeButton: {
    marginTop: 20,
    alignItems: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "green",
  },
  rejectButton: {
    backgroundColor: "red",
  },
  contactPhone: {
    backgroundColor: "white",

    marginTop: 10,
  },
  infoMenu: {
    width: "100%",
    height: 65,
    paddingLeft: 10,
    borderWidth: 1,
    backgroundColor: "white",
    flexDirection: "row",
    borderColor: "#ccc",
    alignItems: "center",
  },
});
