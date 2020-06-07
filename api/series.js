const express = require('express');
const sqlite3 = require('sqlite3');
const seriesRouter = express.Router();
const issuesRouter = require('./issues');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get(`SELECT * FROM Series WHERE Series.id = ${seriesId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.series = row;
            next();
        } else {
            res.status(404).send();
        }
    });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series;',
      (err, rows) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({series: rows});
        }
      });
  });

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series});
});

seriesRouter.post('/', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;

    if (!name || !description) {
        res.status(400).send();
    }

    const sql = `INSERT INTO Series (name, description) 
                VALUES ($name, $description);`;
    const values = {$name: name, 
                    $description: description};
    
    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Series WHERE Series.id = ${this.lastID};`, (err, row) => {
                res.status(201).json({series: row});
            });
        }
    });
});

seriesRouter.put('/:seriesId', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    const seriesId = req.params.seriesId;

    if (!name || !description) {
        res.status(400).send();
    }

    const sql = `UPDATE Series
                SET name = $name, description = $description
                WHERE Series.id = $seriesId;`
    const values = {$name: name,
                    $description: description,
                    $seriesId: seriesId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Series WHERE Series.id = ${seriesId};`, (err, row) => {
                res.status(200).json({series: row});
            });
        }
    });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const seriesId = req.params.seriesId;

    db.get(`SELECT * FROM Issue WHERE Issue.series_id = ${seriesId};`, (err, row) => {
        if (err) {
          next(err);
        } else if (row) {
          res.status(400).send();
        } else {
            db.run(`DELETE FROM Series WHERE Series.id = ${seriesId}`, err => {
                if (err) {
                    res.status(400).send();
                } else {
                    res.status(204).send();
                }
            });
        }
    });
});

module.exports = seriesRouter;