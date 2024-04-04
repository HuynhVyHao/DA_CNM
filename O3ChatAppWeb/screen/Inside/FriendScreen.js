import { SafeAreaView, StyleSheet, Text, View,Pressable } from "react-native";
import React from "react";

const FriendScreen = () => {
  return (
    <SafeAreaView style={{flex:1}}>
      
      <Pressable 
        style={{ backgroundColor: "white",height:50,borderWidth:1,borderColor:"black",justifyContent:"center"}}>
        <Text style={{ fontWeight: "bold", textAlign: "left",fontSize:20,marginLeft:10 }}>Danh sách bạn bè</Text>
      </Pressable>
      
      <Pressable 
        style={{ backgroundColor: "white",height:50,borderWidth:1,borderColor:"black",justifyContent:"center"}}>
        <Text style={{ fontWeight: "bold", textAlign: "left",fontSize:20,marginLeft:10 }}>Danh sách nhóm</Text>
      </Pressable>
      
      <Pressable 
        style={{ backgroundColor: "white",height:50,borderWidth:1,borderColor:"black",justifyContent:"center"}}>
        <Text style={{ fontWeight: "bold", textAlign: "left",fontSize:20,marginLeft:10 }}>Lời mời kết bạn</Text>
      </Pressable>
      
      
    </SafeAreaView>
  );
};

export default FriendScreen;

const styles = StyleSheet.create({
 

});
