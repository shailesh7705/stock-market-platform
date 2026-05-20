function Button(props) {
  return (
    <button
      className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-xl font-semibold transition duration-300"
    >
      {props.text}
    </button>
  );
}

export default Button;