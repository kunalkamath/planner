CalEvent = new Mongo.Collection('calevent');

if (Meteor.isClient) {

  Template.dialog.events({
    'click .closeDialog': function(event, template){
      Session.set('editing_event', null);
    },
    'click .updateClick': function(event, template){
      var title = template.find('#title').value;
      Meteor.call('updateTitle', Session.get('editing_event'), title);
      Session.set('editing_event', null);
    },
    'keypress .updateEnter': function(evt, template){
      if (evt.which === 13){
        var title = template.find('#title').value;
        Meteor.call('updateTitle', Session.get('editing_event'), title);
        Session.set('editing_event', null);
      }
    }
  });

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
        //Session.set('editing_event', calendarEvent._id);
        //$('#title').val(calendarEvent.title);
      },
      eventClick: function(calEvent, jsEvent, view) {
        Session.set('editing_event', calEvent._id);
        $('#title').val(calEvent.title);
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
