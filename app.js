
const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config();
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const itemSchema = {
  name: {
    type: String,
    required: [true]
  }
};

const Item = mongoose.model("Item", itemSchema);

let defaultItems = [
  new Item ({
    name: "Welcome to your new todo list!!"
  }),

  new Item ({
    name: "Press + to add a new todo item."
  }),

  new Item ({
    name: "<-- Press this to delete the item."
  })
]

Item.find({}, function(err, result) {
  let ok = true;
  if(err) {
    ok = false;
  } else {
    if(result.length === 0) {
      ok = false;
    }
  };

  if(!ok) {
    Item.insertMany(defaultItems, function (err) {
        if(err) {
        console.log(err);
      } else {
        console.log("Successfully added default Items");
      }
    });

  };
});

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("list",listSchema);

const port = process.env.PORT || 3000;

app.get("/", function (req,res) {
  Item.find({}, function (err, todos) {
    if(err) {
      res.render('index', {listTitle: "Today", todoList: []});
    } else {
      res.render('index', {listTitle: "Today", todoList: todos});
    }
  });
});

app.get("/:listName", function(req, res) {
  const listName = _.kebabCase(req.params.listName);
  if(listName !== req.params.listName) {
    res.redirect("/" + listName);
  } else {

    List.findOne({name: listName}, function (err, foundList) {
      let list = foundList
      let empty = false;

      if (err) {
        empty = true;
      } else {
        empty = list === null;
      }

      if (empty) {
        list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
      }

      res.render('index', {listTitle: _.startCase(list.name), todoList: list.items})
    });
  };
});

app.get("/about", function (req,res) {
  res.render("about");
});

app.post("/", function(req,res) {
  const itemName = req.body.todoitem;
  const listName = _.kebabCase(req.body.name);
  const item = new Item({
    name: itemName
  });

  if(listName === "today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});

app.post("/delete", function (req,res) {
  const checkedItemId = req.body.check;
  const listName = _.kebabCase(req.body.name);

  if(listName === "today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" +listName);
      }
    });
  }
});

app.listen(process.env.PORT, function () {
  console.log("TodoList V1 is running on http://localhost:" + port);
});

