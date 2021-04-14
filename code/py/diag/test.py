
import subprocess, os
from reportlab.pdfgen import canvas
import sys, json
import time
from AQT import *
def make_list(my_list):
    
    elements = ""
    for i,ele in enumerate(my_list):
        elements = elements + "Question Number."+ str(i) +" ?" + " & " + ele +r" \\ \hline "
       
        

    
    return elements
    

def generate_pdf(parms,answers):
    dir_tex="./"
    tex=dir_tex+"{}.tex".format(parms)
    dir_pdf="./assets/pdf/"
    
    with open(tex,"w") as file:
        file.write(
            r'''
            \documentclass[9pt,a4paper]{article}
            \usepackage[utf8]{inputenc}
            \usepackage{graphicx}
            \pagestyle{headings}


            \title{\begin{figure}[h]
            \centering
            \includegraphics[width=8cm]{./assets/image/logo-black.png}
            \end{figure}
            Questionnaire Results for QCHAT-10}
            \date{May 2020}

            \begin{document}

            \maketitle

            \section{Patient Details}
            \begin{itemize}
                \item Name: Lorem Ipsum
                \item Date of Birth:  15/5/2008
                \item Gender: Male
                \item Previously Received Diagnosis: No
            \end{itemize}



            \section{Answer Summary}

            \begin{table}[h]
            \centering
            \resizebox{\textwidth}{!}{%
            \begin{tabular}{|l|l|}
            \hline
            Question & Answer \\ \hline
            '''
            +
            make_list(answers)
            +
            
            r'''
            \end{tabular}%
            }
            \label{tab:results_base}
            \end{table}

            \section{Analysis}
            The score of the patients shows that the patient has scored X on a scale of 1 to 10. This score indicates that the patient may show signs of autism and should be directed to a medical professional.

            \begin{figure}[h]
            \centering
            \includegraphics[width=8cm]{./assets/image/Screenshot_6.png}
            \end{figure}

            \end{document}
            '''
        )
    
    _ = subprocess.call("pdflatex -aux-directory={} -output-directory={} {}".format(dir_tex,dir_pdf,tex),stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # delete temp files
    os.remove(tex)
    os.remove(dir_tex+"{}.aux".format(parms))
    os.remove(dir_tex+"{}.log".format(parms))

    return "./assets/pdf/"+parms+".pdf"



file_name=json.loads(sys.argv[1])
answers=json.loads(sys.argv[2])
model_type=json.loads(sys.argv[3])
pdf_path = generate_pdf(file_name['questionaire_id'],answers['answers'])

res=0
if(model_type['model']=="Adult"):
    res=AQ10_Adult(answers['answers'])

elif(model_type['model']=="Adolescent"):
    res=AQ10_Adolescent(answers['answers'])

elif(model_type['model']=="Child"):
    res=AQ10_Child(answers['answers'])
    
elif(model_type['model']=="Toddler"):
    res=QCHAT10(answers['answers'])
    
diagnosis_res={"file_path":pdf_path,"result":res}

print(json.dumps(diagnosis_res))
