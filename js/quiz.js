/**
 * quiz.js — Quiz system for ZDEH dungeon escape
 */
const QuizSystem = (function () {
  const quizzes = {
    pwd: {
      question: 'What does the `pwd` command do?',
      options: ['Print working directory', 'Print web data', 'Pause working daemon', 'Process with debug'],
      correct: 0,
    },
    ls: {
      question: 'Which flag makes `ls` show hidden files?',
      options: ['-h', '-l', '-a', '-r'],
      correct: 2,
    },
    cat: {
      question: 'What does `cat filename.txt` do?',
      options: ['Copies the file', 'Deletes the file', 'Displays the file contents', 'Renames the file'],
      correct: 2,
    },
    cd: {
      question: 'What does `cd ..` do?',
      options: ['Go to home directory', 'Go to parent directory', 'Create a directory', 'Delete current directory'],
      correct: 1,
    },
    mkdir: {
      question: 'What does `mkdir` create?',
      options: ['A file', 'A directory', 'A symlink', 'A process'],
      correct: 1,
    },
    touch: {
      question: 'What does `touch newfile.txt` do when the file does not exist?',
      options: ['Deletes it', 'Opens it in an editor', 'Creates an empty file', 'Moves it'],
      correct: 2,
    },
    cp: {
      question: 'What is the correct syntax to copy a file?',
      options: ['cp dest src', 'cp src dest', 'copy src dest', 'mv src dest'],
      correct: 1,
    },
    mv: {
      question: 'What does `mv old.txt new.txt` do?',
      options: ['Copies old.txt to new.txt', 'Deletes old.txt', 'Renames old.txt to new.txt', 'Shows old.txt'],
      correct: 2,
    },
    chmod: {
      question: 'What does `chmod 755 file.txt` do?',
      options: [
        'Deletes the file',
        'Sets read/write/execute for owner, read/execute for others',
        'Encrypts the file',
        'Moves the file',
      ],
      correct: 1,
    },
    grep: {
      question: 'What does `grep "pattern" file.txt` do?',
      options: ['Replaces pattern in file', 'Searches for pattern in file', 'Deletes matching lines', 'Counts words'],
      correct: 1,
    },
    rm: {
      question: 'Which flag is needed to remove a non-empty directory with `rm`?',
      options: ['-a', '-f', '-r', '-l'],
      correct: 2,
    },
    rmdir: {
      question: '`rmdir` can only remove what kind of directory?',
      options: ['Large directories', 'Hidden directories', 'Empty directories', 'Any directory'],
      correct: 2,
    },
    find: {
      question: 'What does `find / -name "file.txt"` do?',
      options: ['Searches for file.txt starting from /', 'Moves file.txt to /', 'Creates file.txt', 'Deletes file.txt'],
      correct: 0,
    },
    ln: {
      question: 'What does `ln -s target link` create?',
      options: ['A hard link', 'A copy', 'A symbolic (soft) link', 'A directory'],
      correct: 2,
    },
    sudo: {
      question: 'What does `sudo` allow you to do?',
      options: ['Delete files faster', 'Run commands as superuser/root', 'Search files', 'List hidden files'],
      correct: 1,
    },
    default: {
      question: 'In Linux, what is the root directory called?',
      options: ['/home', '/root', '/', '/base'],
      correct: 2,
    },
  };

  const masterQuiz = [
    {
      question: 'Which command shows your current directory path?',
      options: ['ls', 'pwd', 'cd', 'cat'],
      correct: 1,
    },
    {
      question: 'How do you search for a pattern inside a file?',
      options: ['find', 'cat', 'grep', 'ls -a'],
      correct: 2,
    },
    {
      question: 'What is a symbolic link?',
      options: [
        'A copy of a file',
        'A pointer/reference to another file or directory',
        'A locked file',
        'A directory',
      ],
      correct: 1,
    },
  ];

  function getQuiz(cmd) {
    return quizzes[cmd] || quizzes.default;
  }

  function getMasterQuiz() {
    return masterQuiz;
  }

  function renderQuiz(quiz, container, onComplete) {
    container.innerHTML = '';
    const q = document.createElement('p');
    q.className = 'quiz-question';
    q.textContent = quiz.question;
    container.appendChild(q);

    let answered = false;
    quiz.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        if (idx === quiz.correct) {
          btn.classList.add('correct');
          setTimeout(() => onComplete(true), 800);
        } else {
          btn.classList.add('wrong');
          const correct = container.querySelectorAll('.quiz-option')[quiz.correct];
          if (correct) correct.classList.add('correct');
          setTimeout(() => onComplete(false), 1200);
        }
      });
      container.appendChild(btn);
    });
  }

  function renderMasterQuiz(container, onComplete) {
    let index = 0;
    let score = 0;

    function showQuestion() {
      if (index >= masterQuiz.length) {
        onComplete(score >= 2);
        return;
      }
      renderQuiz(masterQuiz[index], container, (correct) => {
        if (correct) score++;
        index++;
        showQuestion();
      });
    }
    showQuestion();
  }

  return { getQuiz, getMasterQuiz, renderQuiz, renderMasterQuiz };
})();
