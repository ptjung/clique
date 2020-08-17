<p align="center">
    <img src="readme-demo/readme-demo-brand.png" width="50%">
</p>
<br />

Clique is a web application (heavily inspired by <b>[Watch2Gether](https://www.watch2gether.com/)</b>) for users wanting to watch videos in real-time together. It uses a CRUD account system which allow users who signed up are allowed to create rooms. Each room comes with custom video player widgets, chat integration, and search bar.

## Demo
You can demo it [here](https://cliquepj.herokuapp.com/)! Alternatively, you may want to check out this GIF demo for seeing how two different users can interact:

![](readme-demo/readme-demo-animated.gif)


## Running Locally

#### 1 - Installation
For cloning and installing the packages on the frontend & backend:
```
git clone https://github.com/PtJung/Clique.git
cd Clique
npm i
cd lib
npm i
```

#### 2 - Environment Setup
Create an `.env` file within the `Clique` directory. Then, fill in the following values for each of these keys:
```
REACT_APP_ATLAS_URI - MongoDB connection URI
REACT_APP_PORT - Port to run the server on
REACT_APP_SESSION_LIFE - Life of an account session in seconds
REACT_APP_API_URL - Backend API url
REACT_APP_JWT_SECRET - Secret
REACT_APP_SESS_SECRET - Secret
REACT_APP_YT_SECRET - Secret
REACT_APP_PERMIT_KEY - Secret
```

#### 3 - Running
From the `Clique` directory, run both of the following:
```
node lib/server
npm start
```

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
Usage is provided under the [MIT License](http//opensource.org/licenses/mit-license.php). See LICENSE for the full details.
