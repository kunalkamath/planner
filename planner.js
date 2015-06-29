CalEvent = new Mongo.Collection('calevent');
Router.route('/cal', function() {
  this.render('main');
}, {name: 'cal'
});
Router.route('/', function() {
  this.render('home');
}, {name: 'home'
});
Router.configure({
  layoutTemplate:"menu"
});


if (Meteor.isClient) {

  Template.dialog.events({
    'click .closeDialog': function(event, template){
      Session.set('editing_event', null);
    },
    'click .updateClick': function(event, template){
      var title = template.find('#title').value;
      if(title) {
        Meteor.call('updateTitle', Session.get('editing_event'), title);
        Session.set('editing_event', null);
      }
    },
    'keypress .updateEnter': function(evt, template){
      var title = template.find('#title').value;
      if (evt.which === 13 && title){
        Meteor.call('updateTitle', Session.get('editing_event'), title);
        Session.set('editing_event', null);
      }
    }
  })

  Template.menu.helpers({
      isCurrentPage: function(pageName){
          return Router.current().route.getName() == pageName
      }
  })

  Template.main.helpers({
    editing_event: function(){
      return Session.get('editing_event');
    }
  });

  Template.dialog.helpers({
    title: function(){
      var calEvent = CalEvent.findOne({_id:Session.get('editing_event')});
      return calEvent.title;
    }
  })

  Template.main.rendered = function(){
    var calendar = $('#calendar').fullCalendar({
      dayClick: function(date, allDay, jsEvent, view) {
        var calendarEvent = {};
        calendarEvent.start = date;
        calendarEvent.end = date;
        calendarEvent.title = 'New Event';
        calendarEvent.owner = Meteor.userId();
        Meteor.call('saveCalendarEvent', calendarEvent);
        // Added below in attempt to open event modal upon day click//
        // Session.set('editing_event', calendarEvent._id);
      },
      eventClick: function(calEvent, jsEvent, view) {
        Session.set('editing_event', calEvent._id);
      },
      eventDrop: function(reqEvent){
        Meteor.call('moveEvent', reqEvent);
      },
      events: function(start, end, callback) {
        var calEvents = CalEvent.find({}, {reactive: false}).fetch();
        callback(calEvents);
      },
      editable:true,
      selectable:true
    }).data().fullCalendar;
    Deps.autorun(function(){
      CalEvent.find().fetch();
      if(calendar){
        calendar.refetchEvents();
      }
    })
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      'saveCalendarEvent':function(calendarEvent){
         CalEvent.insert(calendarEvent);
      },
      'updateTitle':function(id, title){
        return CalEvent.update({_id:id}, {$set:{title:title}});
      },
      'moveEvent':function(reqEvent){
        return CalEvent.update({_id:reqEvent._id}, {
          $set:{
            start:reqEvent.start,
            end:reqEvent.end
          }
        })
      }
    });
  });
}
