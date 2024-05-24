import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { DynamoDB } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";
import { useFocusEffect } from "@react-navigation/native";
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: REGION,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});
const Screen2 = ({ showGroupChatInRightBar, user, showBoxChatInRightBar }) => {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [latestMessages, setLatestMessages] = useState({});
  const [allChats, setAllChats] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Lấy danh sách bạn bè của người dùng hiện tại
      const friendsParams = {
        TableName: "Friends",
        Key: { senderEmail: user.email },
      };
      const friendData = await dynamoDB.get(friendsParams).promise();
      const friendsList =
        friendData.Item && friendData.Item.friends
          ? friendData.Item.friends
          : [];

      // Lấy tất cả các hộp thoại mà người dùng đã tham gia
      const allChats = [];
      for (const friend of friendsList) {
        // Lấy tất cả các hộp thoại của người bạn
        const senderChatParams = {
          TableName: "BoxChats",
          KeyConditionExpression: "senderEmail = :sender",
          ExpressionAttributeValues: {
            ":sender": `${user.email}_${friend.email}`,
          },
        };
        const senderChatData = await dynamoDB.query(senderChatParams).promise();
        allChats.push(...senderChatData.Items);

        const receiverChatParams = {
          TableName: "BoxChats",
          KeyConditionExpression: "senderEmail = :sender",
          ExpressionAttributeValues: {
            ":sender": `${friend.email}_${user.email}`,
          },
        };
        const receiverChatData = await dynamoDB
          .query(receiverChatParams)
          .promise();
        allChats.push(...receiverChatData.Items);
      }
      // Lọc tin nhắn gần nhất từ mỗi hộp thoại của mỗi người bạn
      const latestMessages = {};
      for (const friend of friendsList) {
        const friendChats = allChats.filter((chat) =>
          chat.senderEmail.includes(friend.email)
        );
        if (friendChats.length > 0) {
          const latestChat = friendChats.reduce((prev, current) =>
            new Date(prev.createdAt) > new Date(current.createdAt)
              ? prev
              : current
          );
          const latestMessage =
            latestChat.messages.length > 0
              ? latestChat.messages[latestChat.messages.length - 1]
              : null;

          // Nếu tin nhắn cuối cùng tồn tại
          if (latestMessage) {
            // Kiểm tra nếu là hình ảnh
            if (
              typeof latestMessage.content === "string" &&
              latestMessage.content.startsWith("http")
            ) {
              latestMessage.content = "Hình ảnh";
            } else if (latestMessage.fileURL) {
              // Nếu là tệp
              latestMessage.content = "File";
            }

            latestMessages[friend.email] = latestMessage;
          }
        }
      }

      // Lọc danh sách bạn bè chỉ hiển thị những người có tin nhắn gần đây
      const filteredFriends = friendsList.filter(
        (friend) => latestMessages[friend.email]
      );

      // Cập nhật state cho danh sách bạn bè, tất cả các hộp thoại và tin nhắn gần nhất
      setFriends(filteredFriends);
      setAllChats(allChats);
      setLatestMessages(latestMessages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleChatWithFriend = async (friend, user) => {
    try {
      if (!user || !user.email) {
        console.error("Invalid user information");
        return;
      }
      if (!friend || !friend.email) {
        console.error("Invalid friend information");
        return;
      }
      // Kiểm tra xem hộp thoại hiện tại có phải là hộp thoại cũ không

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
                  receiverSoDienThoai: friend.email,
                  messages: [],
                  // Thêm thông tin của người nhận vào box chat của người gửi
                  receiverInfo: {
                    email: friend.email,
                    hoTen: friend.hoTen,
                    avatarUrl: friend.avatarUser,
                  },
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  senderEmail: receiverSenderKey,
                  receiverSoDienThoai: user.email,
                  messages: [],
                  // Thêm thông tin của người gửi vào box chat của người nhận
                  receiverInfo: {
                    email: user.email,
                    hoTen: user.hoTen,
                    avatarUrl: user.avatarUser,
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

  useEffect(() => {
    console.log("Latest Messages:", latestMessages);
  }, [latestMessages]);

  const fetchGroups = async () => {
    try {
      // Fetch group chats
      const groupParams = {
        TableName: "GroupChats",
        FilterExpression: "contains(members, :userEmail)",
        ExpressionAttributeValues: {
          ":userEmail": user.email,
        },
      };
      const groupResponse = await dynamoDB.scan(groupParams).promise();
      if (groupResponse.Items) {
        setGroups(groupResponse.Items);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups(); // Thêm hàm này để tải danh sách nhóm
  }, [user]);

  const handleViewGroup = (group) => {
    showGroupChatInRightBar(group, user);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups(); // Cập nhật danh sách nhóm khi màn hình được focus
    }, [])
  );
  //navigation.navigate("BoxChat", { group });
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.contactPhone}>
        <ScrollView>
          {friends.map((friend, index) => (
            <Pressable
              key={index}
              onPress={() => handleChatWithFriend(friend, user)}
              style={styles.friendContainer}
            >
              <View style={styles.friendInfo}>
                <Image
                  style={styles.avatarImage}
                  source={{ uri: friend.avatarUser }}
                />
                <View style={styles.friendTextContainer}>
                  <Text style={styles.friendName}>{friend.hoTen}</Text>
                  {/* Hiển thị tin nhắn gần nhất của mỗi người bạn */}
                  {latestMessages && latestMessages[friend.email] && (
                    <Text style={styles.latestMessage}>
                      {friend.hasNewMessage ? "[New] " : ""}
                      {latestMessages[friend.email].content}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View
        style={{
          backgroundColor: "white",
          height: "100%",
          marginTop: 20,
        }}
      >
        <ScrollView>
          {groups && groups.length > 0 ? (
            groups.map((group, index) => (
              <Pressable
                onPress={() => handleViewGroup(group)}
                key={index}
                style={styles.infoMenu}
              >
                <Image
                  style={styles.avatarImage}
                  source={{ uri: group.avatarGroup }}
                />
                <Text style={styles.txtUser}>{group.groupName}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.txtUser}>Không có nhóm</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Screen2;

const styles = StyleSheet.create({
  friendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 25,
    marginRight: 10,
  },
  friendTextContainer: {
    flexDirection: "column",
    flex: 1,
  },
  friendName: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  latestMessage: {
    marginLeft: 10,
    marginBottom: 5,
    fontSize: 16,
    color: "#888",
  },
  contactPhone: {
    backgroundColor: "white",
    marginTop: 10,
  },
  txtUser: {
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
  txtTN: {
    color: "#000",
    fontSize: 12,
    marginLeft: 10,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 25,
    marginLeft: 13,
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
  imgAvatar: {
    marginTop: 5,
    marginLeft: 2,
    width: 50,
    height: 50,
  },
  // infoMenu: {
  //   flexDirection: "row",
  //   borderColor: "#ccc",
  //   alignItems: "center",
  //   paddingHorizontal: 10,
  //   paddingVertical: 15,
  // },

  txtUser: {
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
});
