import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  FlatList,
  ScrollView
} from "react-native";
import React, { useState, useEffect } from "react";
import { DynamoDB } from "aws-sdk";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } from "@env";

const Screen2 = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [numGroupJoins, setNumGroupJoins] = useState(0);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const dynamoDB = new DynamoDB.DocumentClient({
        region: REGION,
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      });
  
      const scanParams = {
        TableName: "GroupChats",
      };
  
      const groupData = await dynamoDB.scan(scanParams).promise();
  
      if (groupData.Items && groupData.Items.length > 0) {
        setGroups(groupData.Items);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleViewGroup = (group) => {
    navigation.navigate("BoxChat", { group });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Pressable
        style={{
          backgroundColor: "white",
          height: 60,
          borderWidth: 1,
          borderColor: "black",
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10
        }}
      >
        <Image
          source={require('../../assets/img/iconHomeScreen/Avatar.png')}
          style={styles.imgAvatar}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontWeight: "bold", textAlign: "left", fontSize: 20 }}>Huỳnh Vỹ Hào</Text>
          <Text>Mai đi chơi không</Text>
        </View>
      </Pressable>
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
  imgAvatar: {
    marginTop: 5,
    marginLeft: 2,
    width: 50,
    height: 50,
  },
  infoMenu: {
    flexDirection: "row",
    borderColor: "#ccc",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 25,
    marginLeft: 10,
  },
  txtUser: {
    color: "#000",
    fontSize: 18,
    marginLeft: 10,
  },
});
