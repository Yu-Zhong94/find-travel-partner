import firebase from 'firebase';
import {
  handleSignUp,
  handleLogin,
  handleSignout,
  handleAccountCancellation,
  handlePasswordModification,
  addPost,
  fetchAllPosts,
  fetchFilteredPosts,
  fetchUserPosts,
  updateUserPost,
} from './firebase';


jest.mock('firebase', () => ({
  auth: jest.fn(() => ({
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: {
      uid: 'testUserId',
      email: 'test@example.com',
      password: 'testPassword',
    },
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      })),
      add: jest.fn(),
      get: jest.fn(() => ({
        forEach: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => ({
          forEach: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(() => ({
          forEach: jest.fn(),
        })),
      })),
    })),
  })),
}));

describe('Firebase Functions', () => {
  it('should sign up a user', async () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'testPassword',
      username: 'testUsername',
    };

    await handleSignUp(mockUser);

    expect(firebase.auth().createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.password
    );
    expect(firebase.firestore().collection('users').doc).toHaveBeenCalledWith(
      'testUserId'
    );
    expect(firebase.firestore().collection('users').doc().set).toHaveBeenCalledWith({
      username: mockUser.username,
      email: mockUser.email,
    });
  });
  it('should log in a user', async () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'testPassword',
    };

    await handleLogin(mockUser);

    expect(firebase.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.password
    );
  });

  it('should sign out a user', async () => {
    await handleSignout();

    expect(firebase.auth().signOut).toHaveBeenCalled();
  });

  it('should cancel an account', async () => {
    await handleAccountCancellation();

    expect(firebase.firestore().collection('users').doc().delete).toHaveBeenCalled();
    expect(firebase.auth().currentUser.delete).toHaveBeenCalled();
  });

  it('should update the user password', () => {
    const newPassword = 'newTestPassword';

    handlePasswordModification(newPassword);

    expect(firebase.auth().currentUser.reauthenticateWithCredential).toHaveBeenCalled();
    expect(firebase.auth().currentUser.updatePassword).toHaveBeenCalledWith(newPassword);
  });

  it('should add a post', async () => {
    const mockPostData = {
      title: 'Test Post',
      content: 'This is a test post.',
    };

    await addPost(mockPostData);

    expect(firebase.auth().currentUser.uid).toBe('testUserId');
    expect(firebase.firestore().collection('chatrooms').add).toHaveBeenCalled();
    expect(firebase.firestore().collection('messages').add).toHaveBeenCalled();
    expect(firebase.firestore().collection('posts').add).toHaveBeenCalledWith({
      ...mockPostData,
      userId: 'testUserId',
      chatRoomId: expect.any(String),
      postTime: expect.any(Date),
      enrolled: ['testUserId'],
    });
  });

  it('should fetch all posts', async () => {
    await fetchAllPosts();

    expect(firebase.firestore().collection('posts').get).toHaveBeenCalled();
  });

  it('should fetch filtered posts', async () => {
    const mockUserFilters = {
      gender: 'male',
      age: 25,
    };

    const mockPostFilters = {
      location: 'New York',
      fees: 50,
      sortFees: 'asc',
    };

    await fetchFilteredPosts(mockUserFilters, mockPostFilters);

    expect(firebase.firestore().collection('users').where).toHaveBeenCalledWith(
      'gender',
      '==',
      mockUserFilters.gender
    );
    expect(firebase.firestore().collection('users').where).toHaveBeenCalledWith(
      'age',
      '==',
      mockUserFilters.age
    );
    expect(firebase.firestore().collection('posts').where).toHaveBeenCalledWith(
      'userId',
      'in',
      expect.any(Array)
    );
    expect(firebase.firestore().collection('posts').where).toHaveBeenCalledWith(
      'location',
      '==',
      mockPostFilters.location
    );
    expect(firebase.firestore().collection('posts').where).toHaveBeenCalledWith(
      'fees',
      '<=',
      mockPostFilters.fees
    );
    expect(firebase.firestore().collection('posts').orderBy).toHaveBeenCalledWith(
      'fees',
      mockPostFilters.sortFees
    );
  });

  it('should fetch user posts', async () => {
    const mockQueryString = 'userId';
    const mockQueryCheck = '==';

    await fetchUserPosts(mockQueryString, mockQueryCheck);

    expect(firebase.auth().currentUser.uid).toBe('testUserId');
    expect(firebase.firestore().collection('posts').where).toHaveBeenCalledWith(
      mockQueryString,
      mockQueryCheck,
      firebase.auth().currentUser.uid
    );
  });

  it('should update a user post', async () => {
    const mockPostId = 'testPostId';
    const mockPostData = {
      title: 'Updated Test Post',
      content: 'This is an updated test post.',
    };

    await updateUserPost(mockPostId, mockPostData);

    expect(firebase.auth().currentUser.uid).toBe('testUserId');
    expect(firebase.firestore().collection('posts').doc).toHaveBeenCalledWith(mockPostId);
    expect(firebase.firestore().collection('posts').doc(mockPostId).update).toHaveBeenCalledWith(
      mockPostData
    );
  });
});
