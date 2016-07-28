function lookup(dictionaries, word) {
  for (var i = 0; i < dictionaries.length; i++) {
    var dictionary = dictionaries[i];
    if (dictionary[word]) {
      return dictionary[word];
    }
  }
}

function translateText(dictionaries, text, whenNoMatch) {
  dictionaries = Array.isArray(dictionaries) ? dictionaries : [dictionaries];

  whenNoMatch = typeof whenNoMatch === 'function' ? whenNoMatch : function(word, translations) {
    translations.push(word);
  };

  var translations = [];

  for (var start = 0; start < text.length; start++) {
    var translation = null;
    for (var wordLength = Math.min(10, text.length - start); wordLength > 0; wordLength--) {
      var word = text.slice(start, start + wordLength);
      translation = lookup(dictionaries, word);
      if (translation) {
        translations.push({
          word: word,
          pronunciation: translation.pronunciation,
          meaning: translation.meaning
        });
        // (- 1) to offset the start++ at the end of the loop
        start += wordLength - 1;
        break;
      }
    }
    if (!translation) {
      whenNoMatch(text[start], translations);
    }
  }
  return translations;
}

var FormatTranslation = React.createClass({
  saveTranslation: function() {
    var translation = this.props.translation;
    $.ajax({
      url: '/api/words/',
      method: 'POST',
      data: {word: translation.word},
      success: function(data) {
        state.wordList.push(translation.word);
        render();
      },
      error: function(err) {
        console.log(err);
      }
    });
  },
  componentDidMount: function() {
    $(this.node).tooltip();
  },
  render: function() {
    var translation = this.props.translation;
    if (typeof translation === 'object' && translation.word && translation.pronunciation && translation.meaning) {
      return (
        <span
          ref={(node) => {this.node = node;}}
          data-toggle="tooltip"
          title={'[' + translation.pronunciation + '] ' + translation.meaning}
          className="translation"
          onClick={() => this.saveTranslation()}
        >
          {translation.word}
        </span>
      );
    } else if (typeof translation === 'string') {
      return (
        <span>{translation}</span>
      );
    } else {
      console.log('Make sure you pass in either a {word, pronunciation, meaning} object or a string.',
        'You passed in: ', JSON.stringify(translation));
      return <span></span>;
    }
  }
});

var WordTable = React.createClass({
  render: function() {
    var words = this.props.words;
    if (words.length) {
      return (
        <table
          className="table table-condensed table-hover"
          style={{fontSize: '15px'}}
        >
          <thead>
            <tr>
              <th>Word</th>
              <th>Pronunciation</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {words.map(function(word, i) {
              return <WordTableEntry key={i} word={word} index={i} />
            })}
          </tbody>
        </table> 
      );
    } else {
      console.log('There are currently no words in the word table');
      return <table></table>;
    }
  }
});

var WordTableEntry = React.createClass({
  removeEntry: function() {
    var index = this.props.index
    $.ajax({
      url: '/api/words/' + index,
      method: 'delete',
      success: function() {
        state.wordList.splice(index, 1);
        render();
      },
      error: function(err) {
        console.log(err);
      }
    });
  },
  render: function() {
    var translation = lookup(dictionaries, this.props.word);
    if (translation && translation.meaning && translation.pronunciation) {
      return (
        <tr>
          <td>{this.props.word}</td>
          <td>{translation.pronunciation}</td>
          <td>{translation.meaning}</td>
          <td><button onClick={() => this.removeEntry()}>&times;</button></td>
        </tr>
      );
    } else {
      console.log('No translation for word table entry: ' + this.props.word);
      return <tr></tr>;
    }
  }
});

var App = React.createClass({
  render: function() {
    var state = this.props.state;
    return (
      <div>
        {state.translations.map(function(translation, i) {
          return <span key={i}><FormatTranslation translation={translation} /></span>
        })}
        <WordTable words={state.wordList} />
      </div>
    );
  }
});

function init() {
  var rootEl = document.querySelector('#root');
  var text = rootEl.textContent;

  var state = {
    text: text,
    translations: translateText(dictionaries, text),
    wordList: Object.keys(dictionaries[0]).slice(0, 2),
    rootEl: rootEl
  };

  getWords();

  return state;
}

function render() {
  ReactDOM.render(<App state={state} /> , state.rootEl);
}

function getWords() {
  $.ajax({
    url: '/api/words/',
    method: 'GET',
    success: function(wordList) {
      if (wordList) {
        state.wordList = wordList;
      }
      render();
    },
    error: function(err) {
      console.log(err);
    }
  });
}

var state = init();
