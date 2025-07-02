import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Chessboard, { SIZE as boardSize } from "react-native-chessboardjs";
import { getToken } from "../../../utils/token"; // Make sure this is set up

export default function RoomScreen() {
  const startingPosition =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const { roomId } = useLocalSearchParams();
  const ws = useRef(null);

  const [users, setUsers] = useState({
    white: null,
    black: null,
  });
  const [position, setPosition] = useState(startingPosition);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [side, setSide] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentFen, setCurrentFen] = useState(startingPosition);

  const groupedMoves = moveHistory.reduce((acc, move, index) => {
    const turnIndex = Math.floor(index / 2);
    if (!acc[turnIndex])
      acc[turnIndex] = { number: turnIndex + 1, white: null, black: null };
    if (index % 2 === 0) acc[turnIndex].white = { ...move, index };
    else acc[turnIndex].black = { ...move, index };
    return acc;
  }, []);

  useEffect(() => {
    const token = getToken();
    // if (!token) {
    //   router.replace("/login");
    //   return;
    // }

    // const res = await fetch("http://localhost:3001/auth/verify", {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // const data = await res.json();

    // if (!data.accessToken) {
    //   router.replace("/login");
    //   return;
    // }

    ws.current = new WebSocket(`ws://10.0.2.2:3001/room?roomId=${roomId}`);
    ws.current.onopen = () =>
      ws.current.send(JSON.stringify({ type: "auth", token }));

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "join") {
        setSide(data.side === "w" ? "white" : "black");
        setPosition(data.fen);
        console.log("Joined room:", data);
      } else if (data.type === "players") {
        setUsers((prev) => ({
          white: data.whitePlayer,
          black: data.blackPlayer,
        }));
      } else if (data.type === "position") {
        setPosition(data.fen);
        setCurrentFen(data.fen);
        if (data.result?.san) {
          setMoveHistory((prev) => [
            ...prev,
            { fen: data.fen, san: data.result.san },
          ]);
        }
      } else if (data.type === "chat") {
        setChatMessages((prev) => [...prev, data]);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  const onPieceDrop = (sourceSquare, targetSquare) => {
    ws.current.send(
      JSON.stringify({
        type: "move",
        move: { from: sourceSquare, to: targetSquare, promotion: "q" },
      })
    );
    return true;
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    ws.current?.send(JSON.stringify({ type: "chat", text: chatInput.trim() }));
    setChatInput("");
  };

  const resignGame = () => {
    Alert.alert("Confirm Resign", "Are you sure you want to resign?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resign",
        style: "destructive",
        onPress: () => {
          ws.current?.send(JSON.stringify({ type: "resign" }));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Room ID: {roomId}</Text>
      <Text style={styles.subtitle}>
        Player: {(side === "black" ? users.white : users.black) || "Opponent"}
      </Text>
      <View style={styles.board}>
        <Chessboard
          
          position={position}
          onPieceDrop={onPieceDrop}
          boardOrientation={side}
          animationDuration={0}
        />
      </View>
      <Text style={styles.subtitle}>
        Player: {(side === "black" ? users.black : users.white) || "You"}
      </Text>
      <Button title="Resign" onPress={resignGame} color="#c0392b" />

      <Text style={styles.sectionTitle}>Move History</Text>
      {groupedMoves.map((turn) => (
        <View key={turn.number} style={styles.moveRow}>
          <Text>{turn.number}.</Text>
          <Text
            style={styles.move}
            onPress={() => setPosition(moveHistory[turn.white.index].fen)}
          >
            {turn.white?.san}
          </Text>
          <Text
            style={styles.move}
            onPress={() =>
              turn.black && setPosition(moveHistory[turn.black.index].fen)
            }
          >
            {turn.black?.san}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Chat</Text>
      <FlatList
        data={chatMessages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Text>
            <Text style={{ fontWeight: "bold" }}>{item.username}:</Text>{" "}
            {item.text}
          </Text>
        )}
        style={styles.chat}
      />
      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="Type message"
        />
        <Button title="Send" onPress={sendChat} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 10 },
  board: { width: boardSize, height: boardSize, marginBottom: 16, borderWidth: 5, borderColor: "magenta" },
  sectionTitle: { marginTop: 10, fontWeight: "bold" },
  moveRow: { flexDirection: "row", gap: 8 },
  move: { color: "#2980b9" },
  chat: { maxHeight: 120, marginTop: 10 },
  chatInputRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chatInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    flex: 1,
    borderRadius: 5,
  },
});
