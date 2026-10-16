app/chat.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";

type Message = {
  id: string;
  text: string;
  time: string;
};

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    const text = message.trim();

    if (!text) {
      Alert.alert("Pesan kosong", "Tulis pesan terlebih dahulu.");
      return;
    }

    setMessages((old) => [
      ...old,
      {
        id: Date.now().toString(),
        text,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={10}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={s.title}>💬 Chat Bantuan</Text>
          <Text style={s.subtitle}>Mode demo di perangkat ini</Text>
        </View>
      </View>

      <FlatList
        style={s.list}
        contentContainerStyle={s.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>Belum ada pesan</Text>
            <Text style={s.subtitle}>
              Pesan di sini belum dikirim ke pengguna lain.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.message}>
            <Text style={s.messageText}>{item.text}</Text>
            <Text style={s.time}>{item.time}</Text>
          </View>
        )}
      />

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Tulis pesan..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable style={s.send} onPress={sendMessage}>
          <Text style={s.sendText}>Kirim</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    paddingTop: 30,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 34, color: "#333" },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#777", marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 5 },
  message: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: "#d9fdd3",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  messageText: { fontSize: 16 },
  time: { color: "#777", fontSize: 11, textAlign: "right", marginTop: 5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  send: {
    backgroundColor: "#e53935",
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 18,
  },
  sendText: { color: "#fff", fontWeight: "800" },
});
