const { EventEmitter } = require("events");

const bus = new EventEmitter();
bus.setMaxListeners(0);

function publishToUser(userId, payload) {
  bus.emit(`user:${userId}`, payload);
}

function subscribeUser(userId, handler) {
  const channel = `user:${userId}`;
  bus.on(channel, handler);
  return () => bus.off(channel, handler);
}

function publishIndices(payload) {
  bus.emit("indices", payload);
}

function subscribeIndices(handler) {
  bus.on("indices", handler);
  return () => bus.off("indices", handler);
}

function indicesListenerCount() {
  return bus.listenerCount("indices");
}

module.exports = {
  publishToUser,
  subscribeUser,
  publishIndices,
  subscribeIndices,
  indicesListenerCount,
};
