function FeatureCard(props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-400 transition duration-300">

      <h3 className="text-2xl font-bold mb-4 text-green-400">
        {props.title}
      </h3>

      <p className="text-gray-400">
        {props.description}
      </p>

    </div>
  );
}

export default FeatureCard;