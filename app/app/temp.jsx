import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  Button,
} from "react-native";
import { Chess } from "chess.js";
import Chessboard from "react-native-chessboardjs";

function App() {
  const [chessGame] = useState(new Chess());
  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState("");

  const resetFirstMove = (square) => {
    const hasOptions = getMoveOptions(square);
    if (hasOptions) {
      setMoveFrom(square);
    }
  };

  const getMoveOptions = (square) => {
    const moves = chessGame.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      return false;
    }

    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        backgroundColor: "green",
        height: 15,
        width: 15,
        borderRadius: 50,
      };
      return move;
    });
    setOptionSquares(newSquares);
    return true;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.sectionContainer}>
        <Text style={styles.subtitle}>
                Player:  You
            </Text>
        <View style={{ flex: 1 }}>
          <Chessboard
            customDarkSquareStyle={styles.customDarkSquareStyle}
            customLightSquareStyle={styles.customLightSquareStyle}
            position={chessGame.fen()}
            customSquareStyles={{
              ...optionSquares,
            }}
            onPieceDrop={(sourceSquare, targetSquare, piece) => {
              try {
                chessGame.move({
                  from: sourceSquare,
                  to: targetSquare,
                  promotion: piece?.[1] ?? "q",
                });
                setMoveFrom("");
                setOptionSquares({});
                return true;
              } catch (e) {}
              return false;
            }}
            onSquareClick={(square) => {
              if (!moveFrom) {
                resetFirstMove(square);
                return false;
              }

              try {
                chessGame.move({
                  from: moveFrom,
                  to: square,
                  // use 'q' if not using selection modal
                  promotion: "q", // this is handled by drop event if onPromotionCheck is set
                });
                setMoveFrom("");
                setOptionSquares({});
                return true;
              } catch (e) {
                // invalid move
                resetFirstMove(square);
              }
              return false;
            }}
            isDraggablePiece={({ piece }) => {
              return chessGame.turn() === piece[0];
            }}
            // if a user makes an invalid move attempt they will still see the modal
            // validating moves for promo check requires a bit more work than
            // we show in this example. the if statement can be extended as needed
            onPromotionCheck={(sourceSquare, targetSquare, piece) => {
              if (
                (piece === "wp" &&
                  sourceSquare[1] === "7" &&
                  targetSquare[1] === "8") ||
                (piece === "bp" &&
                  sourceSquare[1] === "2" &&
                  targetSquare[1] === "1")
              ) {
                // continue...
                // check square range diff
                return (
                  Math.abs(
                    sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)
                  ) <= 1
                );
              }
              return false;
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  customDarkSquareStyle: {
    backgroundColor: "#D2691E",
  },
  customLightSquareStyle: {
    backgroundColor: "#DEB887",
  },
  sectionContainer: {
    flex: 1,
    marginTop: 32,
    justifyContent: "space-between",
  },
  bottomBar: {
    marginTop: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
});

export default App;
