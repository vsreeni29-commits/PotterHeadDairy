import {DiarySentence} from "./DiarySentence";
describe("Ink absorption boundaries",()=>{
 it("holds unfinished text",()=>expect(DiarySentence("I need to think")).toBe(0));
 it("absorbs completed sentences but retains a new unfinished one",()=>{
  const text="I felt hurt. I want to";expect(text.slice(DiarySentence(text))).toBe("I want to");
 });
 it("does not split decimal numbers or common honorifics",()=>{
  expect(DiarySentence("It cost 3.14")).toBe(0);expect(DiarySentence("Dr.")).toBe(0);
 });
 it("handles quoted sentences and paragraph breaks",()=>{
  const text='I said "I need time." Then';expect(text.slice(DiarySentence(text))).toBe("Then");
  expect(DiarySentence("A paragraph\n")).toBe(12);
 });
});
