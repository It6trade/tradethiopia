const Note = require('../models/NoteModel.js');

// Create a new note
const createNote = async (req, res) => {
  const { title, content } = req.body;
  try {
    const newNote = new Note({ title, content });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error });
  }
};

// Fetch notes with search functionality
const getNotes = async (req, res) => {
  // Get the search query from the request
  const { search = '' } = req.query; // Default to empty string if search is not provided

  try {
    // Ensure search is a string and sanitize if necessary
    if (typeof search !== 'string') {
      return res.status(400).json({ message: 'Search query must be a string' });
    }

    const notes = await Note.find({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ],
    });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error });
  }
};

// Delete a note
const deleteNote = async (req, res) => {
  const { id } = req.params; // Get note id from URL params

  try {
    // Find the note by ID and delete it
    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully' }); // Confirm deletion
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note', error });
  }
};

// Update a note
const updateNote = async (req, res) => {
  const { id } = req.params; // Get note id from URL params
  const { title, content } = req.body; // Get updated data from request body

  try {
    // Find the note by ID and update it
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { title, content },
      { new: true } // Return the updated document
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(updatedNote); // Return the updated note
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error });
  }
};

module.exports = {
  createNote,
  getNotes,
  deleteNote,
  updateNote
};