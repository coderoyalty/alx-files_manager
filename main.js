import db from './utils/db';

const waitConnection = () => new Promise((resolve, reject) => {
  let i = 0;
  const repeatFct = async () => {
    await setTimeout(() => {
      i += 1;
      if (i >= 10) {
        reject();
      } else if (!db.isAlive()) {
        repeatFct();
      } else {
        resolve();
      }
    }, 1000);
  };
  repeatFct();
});

(async () => {
  console.log(db.isAlive());
  await waitConnection();
  console.log(db.isAlive());
  console.log(await db.nbUsers());
  console.log(await db.nbFiles());
})();
