import io from 'socket.io-client';
import prostgles from "../../dist/prostgles-full";

const socket = io("http://localhost:3001", { path: "/teztz" });

// console.log(socket)
prostgles({
  socket, 
  onReady: async (db) => {
    console.log(db.items)
  }
});