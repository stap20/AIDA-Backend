"""
These Functions Implement the Autism Quotient Trait Test different versions
including AQ-Adult, AQ-Adolesecent, AQ-Child

https://link.springer.com/content/pdf/10.1023/A:1005653411471.pdf
https://link.springer.com/content/pdf/10.1023/A:1005653411471.pdf
https://link.springer.com/content/pdf/10.1007/s10803-007-0504-z.pdf

The Functions accept a list of the answers of the questions in the format
["Definitely Agree","Slightly Agree","Definitely Disagree","Slightly Disagree"]

Unanswered Questions are sent as an empty string""

Insuffecient answers results are returnered as -1
If Invalid Answers are sent an Exception will be thrown



The QCHAT Function implements the QCHAT Score Method for Toddlers

The Function Accepts a list of numbers from 0 - 4 corresponding to the values 
of the paper

Send the function values not revsere scored since the function applies the needed reverse scoring


in AQ10 Methods the questoins are zero indexed howver in the original versions they are 1 indexed to
keep up with the documentation
"""
def validate(scores,valid_values,length):
    for score in scores:
        if(score not in valid_values):
            raise Exception("Invalid Value "+score+" Encountered")
    if(len(scores)!=length):
        raise Exception("This questionaire Needs "+length+" answers")
    


def AQT_Adult(scores):
    valid_values=["Definitely Agree","Slightly Agree","Definitely Disagree","Slightly Disagree"]
    validate(scores,valid_values,50)
    group1=[ 1, 2, 4, 5, 6, 7,9, 12, 13, 16, 18, 19, 20, 21, 22, 23, 26, 33, 35, 39, 41,42, 43, 45, 46]
    group2=[3, 8, 10, 11, 14, 15, 17, 24, 25, 27, 28, 29, 30, 31, 32,34, 36, 37, 38, 40, 44, 47, 48, 49, 50]

    AQT_val=0
    for i,score in enumerate(scores):
        if(i+1 in group1 and score in valid_values[:2]):
            AQT_val+=1
        if(i+1 in group2 and score in valid_values[-2:]):
            AQT_val+=1

    return AQT_val


def AQT_Adolescent(scores):
    valid_values=["Definitely Agree","Slightly Agree","Definitely Disagree","Slightly Disagree"]
    
    validate(scores,valid_values,50)
    
    if(scores.count("")>5):
        return -1

    group1=[2, 4, 5, 6, 7, 9,12, 13, 16, 18, 19, 20, 21, 22, 23, 26, 33, 35, 39, 41, 42, 43, 45, 46]
    group2=[1, 3,8, 10, 11, 14, 15, 17, 24, 25, 27, 28, 29, 30, 31, 32, 34,36, 37, 38, 40, 44, 47, 48, 49, 50]

    AQT_val=0
    for i,score in enumerate(scores):
        if(i+1 in group1 and score in valid_values[:2]):
            AQT_val+=1
        if(i+1 in group2 and score in valid_values[-2:]):
            AQT_val+=1

    return AQT_val



def AQT_Child(scores):
    valid_values=["Definitely Agree","Slightly Agree","Slightly Disagree","Definitely Disagree"]
   
    validate(scores,valid_values,50)
    if(scores.count("")>5):
        return -1
    AQT_val=0
    for score in scores:
        AQT_val+=valid_values.index(score)

    return AQT_val


def QCHAT(scores):
     
    validate(scores,list(range(0,5)),25)
        
    scores =[int(score) for score in scores]
    revsere_scored=[3,7,8,11,12,13,16,18,20,22,23,24,25]
    for score in scores:
        if(score not in list(range(0,5))):
            raise Exception("Invalid Value "+ score+"Encountered")
    QCHAT_val=0

    for i,score in enumerate(scores):
        if(i+1 in revsere_scored):
            QCHAT_val+=4-score
        else:
            QCHAT_val+=score


    return QCHAT_val


#5 28 32 37 27 31 20 41 36 45
#1 2 2 2 2 2 1 2  1  1  2  1


#23 28 10 37 26 38 40 42 11 22
#1  2  2  2  1  2  2  1  2  1
#5 28 10 32 26 20 40 36 22
#1  


def AQ10_Adult(scores):
    valid_values=["Definitely Agree","Slightly Agree","Slightly Disagree","Definitely Disagree"]
    validate(scores,valid_values,10)
    group1=[0,6,7,9] 
    group2=[1,2,3,4,5,8]
    AQT_val=0
    for i,score in enumerate(scores):
        if(i in group1 and score in valid_values[:2]):
            AQT_val+=1
        if(i in group2 and score in valid_values[-2:]):
            AQT_val+=1

    return AQT_val


def AQ10_Adolescent(scores):
    group1=[0, 4, 7, 9]
    group2=[1, 2, 3, 5, 6, 8]
    
        
    valid_values=["Definitely Agree","Slightly Agree","Slightly Disagree","Definitely Disagree"]
    
    validate(scores,valid_values,10)
    AQT_val=0
    for i,score in enumerate(scores):
        if(i in group1 and score in valid_values[:2]):
            AQT_val+=1
        if(i in group2 and score in valid_values[-2:]):
            AQT_val+=1

    return AQT_val


def AQ10_Child(scores):
    group1=[0, 4, 6, 9]
    group2=[1, 2, 3, 5, 7, 8]
    
        
    valid_values=["Definitely Agree","Slightly Agree","Slightly Disagree","Definitely Disagree"]
    
    validate(scores,valid_values,10)
    AQT_val=0
    for i,score in enumerate(scores):
        if(i in group1 and score in valid_values[:2]):
            AQT_val+=1
        if(i in group2 and score in valid_values[-2:]):
            AQT_val+=1

    return AQT_val


def QCHAT10(scores):
    scores=[int(s) for s in scores]
    validate(scores,list(range(0,5)),10)
    revsere_scored=[9]
    scores[-1]=4-scores[-1]

    Q_CHAT_VAL=0
    for score in scores:
        if(score>=2):
            Q_CHAT_VAL+=1
    return Q_CHAT_VAL

'''
t50=["Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree",
"Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree","Slightly Agree",
"Slightly Agree","Slightly Agree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree",
"Slightly Disagree","Slightly Disagree","Slightly Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree",
"Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree",
"Definitely Disagree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree",
"Slightly Agree","Slightly Agree","Slightly Agree"]

t50_2=["Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree",
"Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree",
"Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Slightly Disagree","Slightly Disagree",
"Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree","Slightly Disagree",
"Slightly Disagree","Slightly Disagree","Slightly Disagree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree",
"Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree",
"Slightly Agree","Definitely Agree","Slightly Agree","Definitely Agree","Slightly Agree"]

t10=["Definitely Agree","Definitely Agree","Definitely Agree","Definitely Agree","Definitely Disagree","Definitely Disagree","Definitely Disagree","Slightly Agree",
"Slightly Agree","Slightly Disagree"]

t10_2=["Definitely Disagree","Definitely Disagree","Definitely Disagree","Slightly Agree","Slightly Agree","Definitely Agree","Slightly Disagree","Slightly Disagree","Definitely Agree","Definitely Agree"]

t10_3=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
'''