import FeedIfood from "./components/FeedIfood.jsx";
import FeedGoogle from "./components/FeedGoogle.jsx";
import FeedStories from "./components/FeedStories.jsx";
import "./styles/styles.css";

export default function App() {
  return (
    <div className="container-3colunas">

      <FeedIfood />
      <FeedGoogle />
      <FeedStories />

    </div>
  );
}
