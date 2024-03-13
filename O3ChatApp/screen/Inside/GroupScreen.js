import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "./ChatSceen";
const GroupScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center" }}>
      <LinearGradient
        colors={["#4AD8C7", "#B728A9"]}
        style={styles.background}
      />
      <Pressable
        style={{
          flexDirection: "row",
          backgroundColor: "white",
          height: 60,
          alignItems: "center",
          width: WINDOW_WIDTH,
        }}
      >
        <Image
          style={{ width: 30, height: 30, marginLeft: 15 }}
          source={require("../../assets/img/iconGroupScreen/icons8-add-male-user-group-30.png")}
        />

        <Text style={{ fontSize: 18, marginLeft: 15 }}>Tạo nhóm mới</Text>
      </Pressable>

      {/* Tính năng nổi bật */}
      <View
        style={{
          width: WINDOW_WIDTH,
          marginTop: 15,
          backgroundColor: "white",
          height: 150,
        }}
      >
        <Text style={{ fontSize: 16, marginLeft: 15, marginTop: 10 }}>
          Tính năng nổi bật
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginTop: 20,
            justifyContent: "space-evenly",
          }}
        >
          <Pressable
            style={{
              width: 54,
              height: 58,
              backgroundColor: "#EEEEEE",
              borderRadius: 10,
            }}
          >
            <Image
              style={{ width: 48, height: 48, marginLeft: 3, marginTop: 3 }}
              source={require("../../assets/img/iconGroupScreen/icons8-calendar-48.png")}
            />
            <Text style={{ marginTop: 15, fontSize: 12, textAlign: "center" }}>
              Lịch
            </Text>
          </Pressable>
          <Pressable
            style={{
              width: 54,
              height: 58,
              backgroundColor: "#EEEEEE",
              borderRadius: 10,
            }}
          >
            <Image
              style={{ width: 48, height: 48, marginLeft: 3, marginTop: 3 }}
              source={require("../../assets/img/iconGroupScreen/icons8-remind-48.png")}
            />
            <Text style={{ marginTop: 15, fontSize: 12, textAlign: "center" }}>
              Nhắc hẹn
            </Text>
          </Pressable>
          <Pressable
            style={{
              width: 54,
              height: 58,
              backgroundColor: "#EEEEEE",
              borderRadius: 10,
            }}
          >
            <Image
              style={{ width: 48, height: 48, marginLeft: 3, marginTop: 3 }}
              source={require("../../assets/img/iconGroupScreen/icons8-offline-30.png")}
            />
            <Text style={{ marginTop: 15, fontSize: 12, width: 70 }}>
              Nhóm offline
            </Text>
          </Pressable>
          <Pressable
            style={{
              width: 54,
              height: 58,
              backgroundColor: "#EEEEEE",
              borderRadius: 10,
            }}
          >
            <Image
              style={{ width: 48, height: 48, marginLeft: 3, marginTop: 3 }}
              source={require("../../assets/img/iconGroupScreen/icons8-share-picture-48.png")}
            />
            <Text style={{ marginTop: 15, fontSize: 12, width: 70 }}>
              Chia sẻ ảnh
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Nhóm tham gia */}
      <View
        style={{
          backgroundColor: "white",
          height: "100%",
          width: WINDOW_WIDTH,
          marginTop: 20,
        }}
      >
        <View style={{ flexDirection: "row", marginLeft: 15, marginTop: 10 }}>
          <Text style={{ fontSize: 16 }}>Nhóm đang tham gia (1)</Text>
          <Pressable style={{ flexDirection: "row", marginLeft: 85 }}>
            <Image
              style={{ width: 25, height: 24 }}
              source={require("../../assets/img/iconGroupScreen/icon-arrange.png")}
            />
            <Text>Sắp xếp</Text>
          </Pressable>
        </View>

        {/* Ảnh nhóm mà code k ra  */}
        {/* <View style={{ marginTop: 35 }}>
          <Image
            style={{ width: 358, height: 64, marginLeft: 3, marginTop: 3 }}
            source={require("../../assets/img/iconGroupScreen/image_41.png")}
          />
        </View> */}
        <Image
          source={require("../../assets/img/iconGroupScreen/image41.png")}
        />
      </View>
    </SafeAreaView>
  );
};

export default GroupScreen;

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    height: "100%",
    width: WINDOW_WIDTH,
  },
});
