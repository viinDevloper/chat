import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Ably from "ably";
import Picker from "emoji-mart";
import React, { useState, useEffect } from "react";

//  chave API do Ably
const ably = new Ably.Realtime(
  "WSoEGA.vhO2Mg:QCs4weA8v0Lv8Lj-sNZ9qxRlflVwsRhbjizNQLC9EHM"
);

interface Message {
  id: string;
  data: string;
  timestamp: number;
  fromSelf: boolean;
}

const Chat: React.FC = () => {
  const [messageText, setMessageText] = useState<string>("");
  const [messages, setMessages] = useState<Message[] | Ably.Message[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<boolean>(false); // Controle do picker de emojis
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const channel = ably.channels.get("chat-demo");

  const sendMessage = (): void => {
    try {
      if (messageText.trim()) {
        // Publica a mensagem no canal
        channel.publish("message", messageText);
      }
      setMessageText("");
    } catch (error) {
      console.error(error);
    }
  };

  const addEmoji = (emoji: any) => {
    setMessageText(messageText + emoji.native); // Adiciona o emoji ao texto da mensagem
    setEmojiPickerOpen(false); // Fecha o picker de emojis após a seleção
  };

  useEffect(() => {
    // Subscreve ao canal para receber mensagens
    channel.subscribe("message", (message: Ably.Message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: message.id,
          data: message.data,
          timestamp: message.timestamp,
          fromSelf: false,
        },
      ]);
    });

    // Entrar no canal de presença
    channel.presence.enter("User");

    // Subscrever à presença para monitorar usuários online
    const presenceListener = (members: Ably.PresenceMessage[]) => {
      setOnlineUsers(members.map((member) => member.clientId));
    };

    channel.presence.subscribe("enter", presenceListener);
    channel.presence.subscribe("leave", presenceListener);
    channel.presence.get((err, members) => {
      if (!err) {
        setOnlineUsers(members.map((member) => member.clientId));
      }
    });

    return () => {
      channel.presence.leave();
      channel.unsubscribe();
      ably.close();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.onlineUsersContainer}>
        <Text style={styles.onlineUsersText}>Usuários Online:</Text>
        {onlineUsers.map((user, index) => (
          <Text key={index} style={styles.onlineUser}>
            {user}
          </Text>
        ))}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.fromSelf ? styles.selfMessage : styles.otherMessage,
            ]}
          >
            <Text style={styles.messageText}>
              {new Date(item.timestamp).toLocaleTimeString()}: {item.data}
            </Text>
          </View>
        )}
      />

      {emojiPickerOpen && (
        <View style={styles.emojiPickerContainer}>
          <Picker onSelect={addEmoji} />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setEmojiPickerOpen(!emojiPickerOpen)}>
          <Text style={styles.emojiButton}>😀</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          value={messageText}
          onChangeText={setMessageText}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  onlineUsersContainer: {
    padding: 10,
    backgroundColor: "#e9f7ef",
    marginBottom: 10,
    borderRadius: 10,
  },
  onlineUsersText: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  onlineUser: {
    fontSize: 14,
    color: "#333",
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  selfMessage: {
    backgroundColor: "#6fa3ef",
    alignSelf: "flex-end",
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  emojiPickerContainer: {
    position: "absolute",
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },
  emojiButton: {
    fontSize: 28,
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Chat;
