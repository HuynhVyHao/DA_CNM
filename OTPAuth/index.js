const express = require("express");
const nodemailer = require("nodemailer");
const generatorOTP = require("./generatorOTP");
const AWS = require("aws-sdk");
const socketIO = require("socket.io");
const http = require("http");
require("dotenv").config(); // Đọc các biến môi trường từ file .env
process.env.AWS_SDK_SUPPERESS_MAINTENANCE_MODE_MESSAGE = "1";
// Sử dụng các biến môi trường từ file .env

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
const cors = require("cors");
app.use(cors());

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

// Socket.IO connections
io.on("connection", (socket) => {
  console.log("A client connected.");

  // Handle chat message event
  socket.on("sendMessage", async ({ senderMessage, receiverMessage }) => {
    console.log("Send Message:", senderMessage, receiverMessage);

    // Lưu tin nhắn vào cơ sở dữ liệu DynamoDB
    try {
      const senderParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: senderMessage.senderEmail,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(senderParams).promise();

      const receiverParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: receiverMessage.senderEmail,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [receiverMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(receiverParams).promise();

      // Gửi lại tin nhắn đến tất cả các client
      io.emit("receiveMessage", { senderMessage, receiverMessage });
    } catch (error) {
      console.error("Error saving chat message:", error);
      return;
    }
  });

  // Handle send image event
  socket.on("sendImage", async ({ senderMessage, receiverMessage }) => {
    console.log("Send Image:", senderMessage, receiverMessage);

    try {
      // Lưu tin nhắn vào cơ sở dữ liệu DynamoDB
      const senderParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: senderMessage.senderEmail,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(senderParams).promise();

      const receiverParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: receiverMessage.senderEmail,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [receiverMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(receiverParams).promise();

      // Gửi lại tin nhắn đến tất cả các client
      io.emit("receiveMessage", { senderMessage, receiverMessage });
    } catch (error) {
      console.error("Error saving image message:", error);
      return;
    }
  });

  socket.on(
    "retractMessage",
    async ({ senderEmail, receiverEmail, selectedMessageIndex }) => {
      console.log("Retract Message:", selectedMessageIndex);

      try {
        // Cập nhật tin nhắn trong cơ sở dữ liệu trên máy gửi
        const updateSenderParams = {
          TableName: "BoxChats",
          Key: {
            senderEmail: senderEmail,
          },
          UpdateExpression:
            "SET messages[" +
            selectedMessageIndex +
            "].content = :content, messages[" +
            selectedMessageIndex +
            "].image = :image",
          ExpressionAttributeValues: {
            ":content": "Tin nhắn đã được thu hồi",
            ":image": null,
          },
          ReturnValues: "UPDATED_NEW",
        };
        await dynamoDB.update(updateSenderParams).promise();

        // Cập nhật tin nhắn trong cơ sở dữ liệu trên máy nhận
        const updateReceiverParams = {
          TableName: "BoxChats",
          Key: {
            senderEmail: receiverEmail,
          },
          UpdateExpression:
            "SET messages[" +
            selectedMessageIndex +
            "].content = :content, messages[" +
            selectedMessageIndex +
            "].image = :image",
          ExpressionAttributeValues: {
            ":content": "Tin nhắn đã được thu hồi",
            ":image": null,
          },
          ReturnValues: "UPDATED_NEW",
        };
        await dynamoDB.update(updateReceiverParams).promise();

        // Gửi tin nhắn thu hồi đến máy nhận thông qua socket
        io.emit("receiveRetractMessage", {
          senderEmail,
          receiverEmail,
          selectedMessageIndex,
        });
      } catch (error) {
        console.error("Error retracting message:", error);
        return;
      }
    }
  );

  // Handle send file message event
  socket.on("sendFileMessage", async ({ senderMessage, receiverMessage }) => {
    console.log("Send File Message:", senderMessage, receiverMessage);

    try {
      // Lưu tin nhắn vào cơ sở dữ liệu DynamoDB
      const senderParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: senderMessage.senderEmail,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(senderParams).promise();

      const receiverParams = {
        TableName: "BoxChats",
        Key: {
          senderEmail: receiverMessage.senderEmail,
        },
        UpdateExpression: "SET messages = list_append(messages, :newMessage)",
        ExpressionAttributeValues: {
          ":newMessage": [receiverMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(receiverParams).promise();

      // Gửi lại tin nhắn đến tất cả các client
      io.emit("receiveMessage", { senderMessage, receiverMessage });
    } catch (error) {
      console.error("Error saving file message:", error);
      return;
    }
  });

  // Chat Group

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User joined group ${groupId}`);
  });
  // Handle group message event
  socket.on("sendGroupMessage", async ({ senderMessage }) => {
    console.log("Send Group Message:", senderMessage);

    try {
      const params = {
        TableName: "GroupChats",
        Key: {
          groupId: senderMessage.groupId,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      io.to(senderMessage.groupId).emit("receiveGroupMessage", {
        senderMessage,
      });
    } catch (error) {
      console.error("Error saving group message:", error);
    }
  });

  socket.on("sendGroupImage", async ({ senderMessage }) => {
    console.log("Send Image:", senderMessage);

    try {
      // Lưu tin nhắn vào cơ sở dữ liệu DynamoDB
      const params = {
        TableName: "GroupChats",
        Key: {
          senderEmail: senderMessage.senderEmail,
        },
        UpdateExpression:
          "SET messages = list_append(if_not_exists(messages, :empty_list), :newMessage)",
        ExpressionAttributeValues: {
          ":empty_list": [],
          ":newMessage": [senderMessage],
        },
        ReturnValues: "UPDATED_NEW",
      };
      await dynamoDB.update(params).promise();

      // Gửi lại tin nhắn đến tất cả các thành viên trong nhóm
      io.to(senderMessage.groupId).emit("receiveGroupMessage", {
        senderMessage,
      });
    } catch (error) {
      console.error("Error saving image message:", error);
      return;
    }
  });

  socket.on(
    "retractGroupMessage",
    async ({ groupId, selectedMessageIndex }) => {
      console.log("Retract Group Message:", selectedMessageIndex);

      try {
        // Cập nhật tin nhắn trong cơ sở dữ liệu cho nhóm
        const updateGroupParams = {
          TableName: "GroupChats",
          Key: {
            groupId: groupId,
          },
          UpdateExpression:
            "SET #messages[" +
            selectedMessageIndex +
            "].#content = :content, #messages[" +
            selectedMessageIndex +
            "].#image = :image",
          ExpressionAttributeNames: {
            "#messages": "messages",
            "#content": "content",
            "#image": "image",
          },
          ExpressionAttributeValues: {
            ":content": "Tin nhắn đã được thu hồi",
            ":image": null,
          },
          ReturnValues: "UPDATED_NEW",
        };
        await dynamoDB.update(updateGroupParams).promise();

        // Gửi tin nhắn thu hồi đến tất cả thành viên trong nhóm thông qua socket
        io.emit("receiveRetractGroupMessage", {
          groupId,
          selectedMessageIndex,
        });
      } catch (error) {
        console.error("Error retracting group message:", error);
        return;
      }
    }
  );

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("A client disconnected.");
  });
});

// API endpoint to send OTP via email
app.post("/send-otp", async (req, res) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "huynhvminhofficial@gmail.com",
      pass: "wbag hyzg ocum csfw",
    },
  });

  let otp = generatorOTP();
  let email = req.body.email;
  let mailOptions = {
    from: {
      name: "Minh Huynh",
      address: "huynhvminhofficial@gmail.com",
    },
    to: email,
    subject: "OTP for Verification",
    text: `Your OTP is: ${otp}`,
  };

  const sendMail = async (transporter, mailOptions) => {
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");

      const params = {
        TableName: "OptCheck",
        Item: {
          email: email,
          otp: otp,
        },
      };

      await dynamoDB.put(params).promise();

      res.json({ message: "Email sent successfully", otp: otp });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred while sending email" });
    }
  };
  sendMail(transporter, mailOptions);
});

// API endpoint to verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const params = {
      TableName: "OptCheck",
      Key: {
        email: email,
      },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result || !result.Item || result.Item.otp !== otp) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    await dynamoDB.delete(params).promise();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while verifying OTP" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
