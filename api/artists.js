const express = require('express');
const sqlite3 = require('sqlite3');
const artistsRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.param('artistId', (req, res, next, artistId) => {
    db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.artist = row;
            next();
        } else {
            res.status(404).send();
        }
    });
});

artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE Artist.is_currently_employed = 1;',
      (err, rows) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({artists: rows});
        }
      });
  });

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({artist: req.artist});
});

artistsRouter.post('/', (req, res, next) => {
    const name = req.body.artist.name;
    const dateOfBirth = req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography;
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

    if (!name || !dateOfBirth || !biography) {
        res.status(400).send();
    }

    const sql = `INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) 
                VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed);`;
    const values = {$name: name, 
                    $dateOfBirth: dateOfBirth, 
                    $biography: biography, 
                    $isCurrentlyEmployed: isCurrentlyEmployed};
    
    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID};`, (err, row) => {
                res.status(201).json({artist: row});
            });
        }
    });
});

artistsRouter.put('/:artistId', (req, res, next) => {
    const name = req.body.artist.name;
    const dateOfBirth = req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography;
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    const artistId = req.params.artistId;

    if (!name || !dateOfBirth || !biography) {
        res.status(400).send();
    }

    const sql = `UPDATE Artist
                SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed
                WHERE Artist.id = $artistId;`
    const values = {$name: name,
                    $dateOfBirth: dateOfBirth,
                    $biography: biography,
                    $isCurrentlyEmployed: isCurrentlyEmployed,
                    $artistId: artistId};
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId};`, (err, row) => {
                res.status(200).json({artist: row});
            });
        }
    });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
    const artistId = req.params.artistId;

    const sql = `UPDATE Artist
                SET is_currently_employed = $isCurrentlyEmployed
                WHERE Artist.id = $artistId;`
    const values = {$isCurrentlyEmployed: 0,
                    $artistId: artistId};
                    
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId};`, (err, row) => {
                res.status(200).json({artist: row});
            });
        }
    });    
});

module.exports = artistsRouter;