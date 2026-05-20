import {

  useEffect,
  useState

} from "react";

import {

  Newspaper,
  ExternalLink

} from "lucide-react";

import {

  motion

} from "framer-motion";

import Card from "../ui/Card";

import {

  getMarketNews

} from "../../services/newsService";

function MarketNews() {

  const [news, setNews] =
    useState([]);

  useEffect(() => {

    fetchNews();

  }, []);

  const fetchNews = async () => {

    try {

      const data =
        await getMarketNews();

      setNews(data);

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <Card className="lg:col-span-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">

        <div
          className="

            w-10 h-10

            rounded-2xl

            bg-blue-500/10

            flex items-center justify-center

            text-blue-400

          "
        >

          <Newspaper size={18} />

        </div>

        <div>

          <h2 className="text-base font-bold">

            Market News

          </h2>

          <p className="text-[11px] text-gray-500 mt-1">

            Live market intelligence

          </p>

        </div>

      </div>

      {/* News List */}
      <div className="space-y-3">

        {news.map((article, index) => (

          <motion.a

            key={index}

            href={article.url}

            target="_blank"

            rel="noreferrer"

            whileHover={{
              y: -2
            }}

            className="

              flex gap-4

              rounded-2xl

              border border-white/4

              bg-white/3

              p-3

              hover:bg-white/5

              transition-all

            "

          >

            {/* Image */}
            <img

              src={

                article.image ||

                "https://placehold.co/120x80"

              }

              alt="news"

              className="

                w-28 h-20

                rounded-xl

                object-cover

                shrink-0

              "

            />

            {/* Content */}
            <div className="flex-1 min-w-0">

              <div className="flex items-center justify-between gap-3">

                <p
                  className="

                    text-xs

                    text-green-400

                    font-medium

                  "
                >

                  {article.source}

                </p>

                <ExternalLink

                  size={14}

                  className="text-gray-500"

                />

              </div>

              <h3
                className="

                  text-sm

                  font-semibold

                  mt-2

                  line-clamp-2

                "
              >

                {article.title}

              </h3>

              <p
                className="

                  text-xs

                  text-gray-500

                  mt-2

                  line-clamp-2

                "
              >

                {article.description}

              </p>

            </div>

          </motion.a>

        ))}

      </div>

    </Card>

  );

}

export default MarketNews;