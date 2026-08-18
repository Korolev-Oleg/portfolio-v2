import Prodlogistica from "@/components/WebProjects/video/prodlogistica.mp4";
import ProdlogisticaGif from "@/components/WebProjects/gif/prodlogistica.gif";
import Cleaning from "@/components/WebProjects/video/cleaning.mp4";
import CleaningGif from "@/components/WebProjects/gif/cleaning.gif";
import Fruitprod from "@/components/WebProjects/video/fruitprod.mp4";
import FruitprodGif from "@/components/WebProjects/gif/fruitprod.gif";
import Steamsales from "@/components/WebProjects/video/steamsales.mp4";
import SteamsalesGif from "@/components/WebProjects/gif/steamsales.gif";

const slides = [
  {
    video: Cleaning,
    gif: CleaningGif,
    title: "Cleaning Service",
    description: "Responsive service website with a focused booking journey.",
    githubLink: "https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/cleaning",
    previewLink: "/cleaning"
  },
  {
    video: Prodlogistica,
    gif: ProdlogisticaGif,
    title: "Prodlogistica",
    description: "Wholesale catalogue and order workflow integrated with 1C.",
    githubLink: "https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/prodlogistica",
    previewLink: "https://prodlogistica.ru/"
  },
  {
    video: Fruitprod,
    gif: FruitprodGif,
    title: "Fruit Catalogue",
    description: "Product catalogue interface for a food supplier.",
    githubLink: "https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/fruit",
    previewLink: "/fruit"
  },
  {
    video: Steamsales,
    gif: SteamsalesGif,
    title: "Steam Sales",
    description: "Interactive storefront concept for game promotions.",
    githubLink: "https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/steamsales",
    previewLink: "/steamsales"
  }
]

export default slides;
