// importa express
const application = require('express')();
// importa http y crea la aplicacion del server
const server = require('http').createServer(application)
// importa socket.io
const io = require('socket.io')(server);
// genera el puerto a utilizar
const PORT = process.env.PORT || 3000

// arreglo de usuarios registrados
const connected = [];

// obtiene la ruta de navegacion
application.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

// activacion del puerto
server.listen(PORT, () => {
   console.log('Servidor ejecutando en puerto: ' + PORT);
});

// conexion del socket al servidor
io.on('connection', (socket) => {
   // desconexion del socket al server
   socket.on('disconnect', () => {
      delete connected[socket.username];
      console.log('Usuario desconectado - Usuario: ' + socket.username);
   });

   // envio de mensaje desde un cliente
   socket.on('new message', (msg) => {
      io.emit('send message', {message: msg, user: socket.username});
   });

   // validacion de usuarios a conectar en el servidor
   socket.on('new user', (usr) => {
      if (connected[usr]) {
         socket.emit("username error","Nombre ocupado, prueba con otro");
      } else {
         connected[usr] = socket.id;
         socket.username = usr;
         console.log('Usuario conectado - Usuario: ' + socket.username);
         socket.emit("username success", usr);
      }
   });

   // envio de mensajes privados desde un cliente a otro
   socket.on('send private message', (data) => {
      const recipient = connected[data.username];
      if (recipient) {
         io.to(recipient).emit('private message', { sender: socket.username, message: data.message });
         socket.emit('new private message', data.username);
      } else {
         socket.emit('username error', 'Usuario no encontrado');
      }
   });

   // obtencion de usuarios conectados
   socket.on('get connected users', () => {
      socket.emit('connected users', Object.keys(connected));
   });

   // envio de imagen
   socket.on('send image', (imageData) => {
      socket.broadcast.emit('receive image', imageData);
   });

   // recibir de la imagen
   socket.on('receive image', (imageData) => {
      const messageList = document.getElementById('message_list');
      const chatItem = document.createElement('li');
      const image = document.createElement('img');
      image.src = imageData;
      chatItem.appendChild(image);
      messageList.appendChild(chatItem);
      window.scrollTo(0, document.body.scrollHeight);
   });
});

