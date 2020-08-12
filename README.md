# Clique
![](readme-demo/readme-demo.png)



## Description
Clique is a web application (heavily inspired by <b>[Watch2Gether](https://www.watch2gether.com/)</b>) for users wanting to watch videos in real-time together. It uses a CRUD account system which allow users who signed up are allowed to create rooms. Each room comes with custom video player widgets, chat integration, and search bar.

You can demo it [here](https://cliquepj.herokuapp.com/)!

## Built With

* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - For storing users and rooms in a databasae
* [Express.js](https://expressjs.com/) - Executes most backend logic via REST API
* [React](https://reactjs.org/) - Used to create most of the frontend
* [Node.js](https://nodejs.org/) - The runtime in which Clique runs on
* [Socket.io](https://socket.io/) - Emulates real-time interactions between users
* [jQuery](https://jquery.com/) - Implements a clickable version of [DataTables](https://datatables.net/)
* [YouTube Data API](https://developers.google.com/youtube/v3) - Retrieves search bar results
* [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference) - Manipulates the IFrame for real-time video playing

## License
[MIT](https://choosealicense.com/licenses/mit/)
