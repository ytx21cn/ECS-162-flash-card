"use strict";

import { currentFlashCard, makeRequest } from "./main.js";
import { requestTranslation } from "./translate.js";
import { requestToSave } from "./save-to-database.js";
import { requestFlashCards, getNextCard } from "./review-words.js";

let currentCard = {};

function AddWordsPage(props) {

	setSwitchViewButton("review");

	function translate(event) {
		const queryBox = document.getElementById("js-query");
		const outputBox = document.getElementById("js-output");

		if (event.key === "Enter") {
			requestTranslation(event.target.value, queryBox, outputBox);
		}
	}

	function saveToDatabase() {
		try {
			requestToSave(currentFlashCard);
		} catch (error) {
			console.log(error);
		}
	}

	return React.createElement(
		"div",
		{ className: "ui-main" },
		React.createElement(
			"div",
			{ className: "flashcard__flexbox" },
			React.createElement(
				"div",
				{ className: "flashcard__card", title: "Press ENTER to translate" },
				React.createElement("input", { id: "js-query", onKeyUp: translate, className: "flashcard__textbox t-font--primary", type: "text", autocomplete: "off", placeholder: "English" })
			),
			React.createElement(
				"div",
				{ className: "flashcard__card" },
				React.createElement("input", { id: "js-output", className: "flashcard__textbox t-font--primary", type: "text", autocomplete: "off", placeholder: "Chinese \u4E2D\u6587", readonly: "readonly" })
			)
		),
		React.createElement(
			"p",
			{ className: "primary-action-button__par" },
			React.createElement(
				"button",
				{ id: "js-save", onClick: saveToDatabase, className: "ui-button primary-action-button t-font--primary" },
				"Save"
			)
		)
	);
}

function ReviewPage(props) {

	setSwitchViewButton("add-words");

	function displayNextCard() {
		currentCard = getNextCard();
		const translation = document.getElementById("js-translation");
		let Chinese = currentCard.Chinese;
		translation.value = Chinese;

		const xhr = new XMLHttpRequest();
		makeRequest(xhr, `/update-seen?Chinese=${Chinese}`, function () {
			console.log(xhr.response);
			requestFlashCards();
		});
	}

	function checkCorrect(answer) {
		let EnglishWords = currentCard.details.English;
		let isCorrect = !!EnglishWords && EnglishWords.includes(answer);

		if (isCorrect) {
			const translation = document.getElementById("js-translation");
			let Chinese = translation.value;

			const xhr = new XMLHttpRequest();
			makeRequest(xhr, `/update-correct?Chinese=${Chinese}`, function () {
				console.log(xhr.response);
				requestFlashCards();
			});
		}

		return isCorrect;
	}

	function flipCard() {
		const answer = document.getElementById("js-answer");
		let isCorrect = checkCorrect(answer.value);
	}

	return React.createElement(
		"div",
		{ className: "ui-main" },
		React.createElement(
			"div",
			{ className: "flashcard__flexbox" },
			React.createElement(
				"div",
				{ className: "flashcard__card flashcard__card--translation" },
				React.createElement("input", { id: "js-translation", className: "flashcard__textbox t-font--primary", type: "text", placeholder: "Translation", readonly: "readonly" }),
				React.createElement("img", { className: "flashcard__flip-card-icon", src: "icons/flip-card.svg", alt: "Flip card", onClick: flipCard })
			),
			React.createElement(
				"div",
				{ className: "flashcard__card flashcard__card--english" },
				React.createElement("input", { id: "js-answer", className: "flashcard__textbox t-font--primary", type: "text", placeholder: "English" })
			)
		),
		React.createElement(
			"p",
			{ className: "primary-action-button__par" },
			React.createElement(
				"button",
				{ id: "js-next", className: "ui-button primary-action-button t-font--primary", onClick: displayNextCard },
				"Next"
			)
		)
	);
}

class View extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.flashCards === "{}" || this.props.switchTo === "add-words") {
			return React.createElement(AddWordsPage, null);
		} else {
			return React.createElement(ReviewPage, null);
		}
	}
}

const UIMain = document.getElementById("js-ui-main");

function setUIMainView(view) {
	document.body.setAttribute("data-js-current-view", view);
	ReactDOM.render(React.createElement(View, { switchTo: view }), UIMain);
	if (view === "review") {
		const nextWordButton = document.getElementById("js-next");
		nextWordButton.click();
	}
}

function setSwitchViewButton(view) {
	const switchViewButton = document.getElementById("js-switch-view-button");

	if (view === "add-words") {
		switchViewButton.textContent = "Add";
	} else {
		switchViewButton.textContent = "Start Review";
	}

	switchViewButton.onclick = function () {
		requestFlashCards();
		setUIMainView(view);
	};
}

// Initial loading

// Render the initial view from an xhr fresponse
function renderInitialView(xhr) {
	let view = xhr.responseText === "{}" ? "add-words" : "review";
	setUIMainView(view);
}
UIMain.addEventListener("load", requestFlashCards(renderInitialView));