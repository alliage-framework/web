import { BodyAlreadySetError } from '../response';

describe('webserver/network/response', () => {
  describe('BodyAlreadySetError', () => {
    it('should have the correct default message', () => {
      const error = new BodyAlreadySetError();

      expect(error.message).toEqual("Can't send data when the body has been set.");
    });
  });
});
